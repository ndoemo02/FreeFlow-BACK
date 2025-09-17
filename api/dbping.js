// api/dbping.js (przykład)
export default async (_req, res) => {
  try {
    // tu użyj swojego klienta supabase z configu
    // np. const { data, error } = await supabase.from('orders').select('count', { head:true });
    res.json({ ok:true });
  } catch (e) {
    res.status(500).json({ ok:false, error: String(e?.message || e) });
  }
};