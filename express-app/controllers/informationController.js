const pool = require('../config/database');

class InformationController {
  async getBanners(req, res) {
    const client = await pool.connect();

    try {
      const getBannersQuery = `
        SELECT banner_name, banner_image, description
        FROM banners
        ORDER BY id ASC
      `;

      const result = await client.query(getBannersQuery);
      const banners = result.rows;

      return res.status(200).json({
        status: 0,
        message: 'Sukses',
        data: banners
      });

    } catch (error) {
      console.error('Get banners error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }


  // GET /services
  async getServices(req, res) {
    const client = await pool.connect();
    
    try {
      // Get all active services using prepared statement
      const getServicesQuery = `
        SELECT service_code, service_name, service_icon, service_tariff
        FROM services
        ORDER BY id ASC
      `;
      
      const result = await client.query(getServicesQuery);

      const services = result.rows;

      return res.status(200).json({
        status: 0,
        message: 'Sukses',
        data: services
      });

    } catch (error) {
      console.error('Get services error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new InformationController();