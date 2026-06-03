const mysql = require('mysql2/promise');

const getPool = () => {
  // Normalize DB password: treat 'No' as empty string
  const rawPassword = process.env.DB_PASSWORD;
  const password = (rawPassword === 'No' || rawPassword === 'NO' || rawPassword === 'no') ? '' : (rawPassword || '');

  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'sistrackv2',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
  });
};

const buildLast7DaysLabels = () => {
  const labels = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    labels.push(`${yyyy}-${mm}-${dd}`);
  }
  return labels;
};

const createAnalyticsHandlers = async () => {
  const pool = getPool();

  return {
    GetDashboardSummary: async (call, callback) => {
      try {
        const [totalsRows] = await pool.query(
          `
          SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(total_amount), 0) AS total_revenue
          FROM orders
          WHERE status = 'completed'
          `
        );

        const totalOrders = Number(totalsRows[0]?.total_orders || 0);
        const totalRevenue = Number(totalsRows[0]?.total_revenue || 0);

        const labels = buildLast7DaysLabels();

        const [dailyRows] = await pool.query(
          `
          SELECT
            DATE(completed_at) AS day,
            COUNT(*) AS orders_count,
            COALESCE(SUM(total_amount), 0) AS revenue_sum
          FROM orders
          WHERE status = 'completed'
            AND completed_at IS NOT NULL
            AND completed_at >= (CURDATE() - INTERVAL 6 DAY)
          GROUP BY DATE(completed_at)
          ORDER BY day ASC
          `
        );

        const dailyMap = new Map();
        for (const r of dailyRows) {
          const day = r.day ? new Date(r.day).toISOString().slice(0, 10) : null;
          if (!day) continue;
          dailyMap.set(day, {
            orders: Number(r.orders_count || 0),
            revenue: Number(r.revenue_sum || 0),
          });
        }

        const ordersValues = labels.map((d) => Number(dailyMap.get(d)?.orders || 0));
        const revenueValues = labels.map((d) => Number(dailyMap.get(d)?.revenue || 0));

        const [activeSeatsRows] = await pool.query(
          `
          SELECT COUNT(DISTINCT seat_number) AS active_seats
          FROM orders
          WHERE status != 'completed' AND status != 'cancelled'
          `
        );
        const activeSeats = Number(activeSeatsRows[0]?.active_seats || 0);

        callback(null, {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          orders_chart: { labels, values: ordersValues.map((v) => Number(v)) },
          revenue_chart: { labels, values: revenueValues.map((v) => Number(v)) },
          active_seats: activeSeats,
        });
      } catch (err) {
        callback(err);
      }
    },
  };
};

module.exports = { createAnalyticsHandlers, getPool };
