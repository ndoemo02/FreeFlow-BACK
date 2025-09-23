import assert from 'node:assert/strict';
import test from 'node:test';
import { routeOrderToBusiness } from '../api/order-routing.js';

class MockSupabaseClient {
  constructor(fixtures) {
    this.fixtures = fixtures;
  }

  from(table) {
    return new MockQueryBuilder(table, this.fixtures);
  }
}

class MockQueryBuilder {
  constructor(table, fixtures) {
    this.table = table;
    this.fixtures = fixtures;
    this.filters = [];
    this.limitValue = null;
    this.singleResult = false;
    this.selectedColumns = null;
    this.joinColumns = {};
  }

  select(columns) {
    this._parseSelectedColumns(columns);
    return this;
  }

  _parseSelectedColumns(columns) {
    const parts = (columns || '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    this.selectedColumns = [];
    this.joinColumns = {};

    for (const part of parts) {
      const joinMatch = part.match(/^(.*)!inner\((.*)\)$/);
      if (joinMatch) {
        const [, relation, fields] = joinMatch;
        this.joinColumns[relation] = fields
          .split(',')
          .map(field => field.trim())
          .filter(Boolean);
        this.selectedColumns.push(relation);
      } else {
        this.selectedColumns.push(part);
      }
    }
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.singleResult = true;
    this.limitValue = 1;
    return this;
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }

  async _execute() {
    const tableData = this.fixtures[this.table] || [];
    let rows = tableData.map(row => ({ ...row }));

    rows = rows.filter(row => this.filters.every(filter => this._matches(row, filter)));

    if (this._shouldJoinCategories()) {
      rows = rows
        .map(row => {
          const category = this._findCategory(row.category_id);
          if (!category) return null;
          return { ...row, business_categories: category };
        })
        .filter(Boolean);
    }

    if (typeof this.limitValue === 'number') {
      rows = rows.slice(0, this.limitValue);
    }

    const data = this._selectColumns(rows);

    if (this.singleResult) {
      return { data: data[0] ?? null, error: null };
    }

    return { data, error: null };
  }

  _shouldJoinCategories() {
    return Object.keys(this.joinColumns).includes('business_categories');
  }

  _matches(row, { column, value }) {
    if (column.includes('.')) {
      const [relation, field] = column.split('.');
      if (relation === 'business_categories') {
        const category = this._findCategory(row.category_id);
        if (!category) return false;
        return category[field] === value;
      }
      return false;
    }

    return row[column] === value;
  }

  _findCategory(categoryId) {
    const categories = this.fixtures.business_categories || [];
    return categories.find(category => category.id === categoryId) || null;
  }

  _selectColumns(rows) {
    if (!this.selectedColumns) {
      return rows.map(row => ({ ...row }));
    }

    return rows.map(row => {
      const result = {};

      for (const column of this.selectedColumns) {
        if (column === '*') {
          return { ...row };
        }

        if (column in this.joinColumns) {
          const relationData = row[column] ?? this._getRelationData(column, row);
          if (!relationData) {
            result[column] = null;
            continue;
          }

          const fields = this.joinColumns[column];
          if (fields.length === 0) {
            result[column] = { ...relationData };
          } else {
            result[column] = fields.reduce((acc, field) => {
              acc[field] = relationData[field];
              return acc;
            }, {});
          }

          continue;
        }

        result[column] = row[column];
      }

      return result;
    });
  }

  _getRelationData(relation, row) {
    if (relation === 'business_categories') {
      return this._findCategory(row.category_id);
    }

    return null;
  }
}

function createMockSupabaseFixtures() {
  return {
    business_categories: [
      { id: 'cat-pizzeria', name: 'pizzeria' },
      { id: 'cat-sushi', name: 'sushi' },
      { id: 'cat-fast-food', name: 'fast_food' }
    ],
    businesses: [
      {
        id: 'biz-pizza-1',
        name: 'Mario Pizza',
        category_id: 'cat-pizzeria',
        is_active: true,
        is_verified: true,
        latitude: 50.01,
        longitude: 19.0,
        city: 'Katowice'
      },
      {
        id: 'biz-sushi-1',
        name: 'Sushi Central',
        category_id: 'cat-sushi',
        is_active: true,
        is_verified: true,
        latitude: 50.001,
        longitude: 19.0,
        city: 'Katowice'
      },
      {
        id: 'biz-burger-1',
        name: 'Burger Joint',
        category_id: 'cat-fast-food',
        is_active: true,
        is_verified: true,
        latitude: 50.02,
        longitude: 19.02,
        city: 'Katowice'
      }
    ]
  };
}

test('routes pizza orders to the closest pizzeria even when sushi is nearer', async () => {
  const supabase = new MockSupabaseClient(createMockSupabaseFixtures());

  const result = await routeOrderToBusiness(
    {
      order_items: [
        {
          name: 'Margherita Pizza',
          quantity: 1,
          price: 35
        }
      ],
      customer_location: { lat: 50.0, lng: 19.0 },
      order_type: 'regular'
    },
    { supabaseClient: supabase }
  );

  assert.equal(result.reason, 'location_based');
  assert.equal(result.business_id, 'biz-pizza-1');
});

test('routes sushi orders to sushi businesses when falling back to availability', async () => {
  const supabase = new MockSupabaseClient(createMockSupabaseFixtures());

  const result = await routeOrderToBusiness(
    {
      order_items: [
        {
          name: 'Salmon Sashimi',
          quantity: 1,
          price: 42
        }
      ],
      customer_location: null,
      order_type: 'regular'
    },
    { supabaseClient: supabase }
  );

  assert.equal(result.reason, 'fallback_available');
  assert.equal(result.business_id, 'biz-sushi-1');
});
