const pool = require('../config/database');

const generateInvoiceNumber = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9999) + 1;
  const invoiceNum = String(random).padStart(3, '0');
  
  return `INV${day}${month}${year}-${invoiceNum}`;
};

class TransactionController {
  getBalance = async (req, res) => {
    const client = await pool.connect();
    
    try {
      const email = req.userEmail;

      const getBalanceQuery = `
        SELECT b.balance
        FROM users u
        INNER JOIN balances b ON u.id = b.user_id
        WHERE u.email = $1
      `;
      
      const result = await client.query(getBalanceQuery, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      const balance = result.rows[0].balance;

      return res.status(200).json({
        status: 0,
        message: 'Get Balance Berhasil',
        data: {
          balance: parseInt(balance)
        }
      });

    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  topup = async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const email = req.userEmail;
      const { top_up_amount } = req.body;

      if (top_up_amount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 102,
          message: 'Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0',
          data: null
        });
      }

      const getUserQuery = 'SELECT id FROM users WHERE email = $1';
      const userResult = await client.query(getUserQuery, [email]);

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      const userId = userResult.rows[0].id;

      const updateBalanceQuery = `
        UPDATE balances 
        SET balance = balance + $1
        WHERE user_id = $2
        RETURNING balance
      `;
      
      const balanceResult = await client.query(updateBalanceQuery, [top_up_amount, userId]);
      const newBalance = balanceResult.rows[0].balance;

      const invoiceNumber = generateInvoiceNumber();

      const insertTransactionQuery = `
        INSERT INTO transactions 
        (user_id, invoice_number, transaction_type, total_amount, description, created_on)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      await client.query(insertTransactionQuery, [
        userId,
        invoiceNumber,
        'TOPUP',
        top_up_amount,
        'Top Up balance'
      ]);

      await client.query('COMMIT');

      return res.status(200).json({
        status: 0,
        message: 'Top Up Balance berhasil',
        data: {
          balance: parseInt(newBalance)
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Topup error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  transaction = async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const email = req.userEmail;
      const { service_code } = req.body;

      const getUserQuery = `
        SELECT u.id, b.balance
        FROM users u
        INNER JOIN balances b ON u.id = b.user_id
        WHERE u.email = $1
      `;
      
      const userResult = await client.query(getUserQuery, [email]);

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      const userId = userResult.rows[0].id;
      const currentBalance = parseInt(userResult.rows[0].balance);

      const getServiceQuery = `
        SELECT service_code, service_name, service_tariff
        FROM services
        WHERE service_code = $1 
      `;
      
      const serviceResult = await client.query(getServiceQuery, [service_code]);

      if (serviceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 102,
          message: 'Service ataus Layanan tidak ditemukan',
          data: null
        });
      }

      const service = serviceResult.rows[0];
      const serviceTariff = parseInt(service.service_tariff);

      if (currentBalance < serviceTariff) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 102,
          message: 'Saldo tidak mencukupi',
          data: null
        });
      }

      const updateBalanceQuery = `
        UPDATE balances 
        SET balance = balance - $1
        WHERE user_id = $2
      `;
      
      await client.query(updateBalanceQuery, [serviceTariff, userId]);

      const invoiceNumber = generateInvoiceNumber();

      const insertTransactionQuery = `
        INSERT INTO transactions 
        (user_id, invoice_number, transaction_type, service_code, service_name, total_amount, description, created_on)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING invoice_number, service_code, service_name, transaction_type, total_amount, created_on
      `;
      
      const transactionResult = await client.query(insertTransactionQuery, [
        userId,
        invoiceNumber,
        'PAYMENT',
        service.service_code,
        service.service_name,
        serviceTariff,
        service.service_name
      ]);

      await client.query('COMMIT');

      const transaction = transactionResult.rows[0];

      return res.status(200).json({
        status: 0,
        message: 'Transaksi berhasil',
        data: {
          invoice_number: transaction.invoice_number,
          service_code: transaction.service_code,
          service_name: transaction.service_name,
          transaction_type: transaction.transaction_type,
          total_amount: parseInt(transaction.total_amount),
          created_on: transaction.created_on
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  getHistory = async (req, res) => {
    const client = await pool.connect();
    
    try {
      const email = req.userEmail;
      const offset = parseInt(req.query.offset) || 0;
      const limit = req.query.limit ? parseInt(req.query.limit) : null;

      const getUserQuery = 'SELECT id FROM users WHERE email = $1';
      const userResult = await client.query(getUserQuery, [email]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      const userId = userResult.rows[0].id;

      let getHistoryQuery;
      let queryParams;

      if (limit) {
        getHistoryQuery = `
          SELECT 
            invoice_number,
            transaction_type,
            description,
            total_amount,
            created_on
          FROM transactions
          WHERE user_id = $1
          ORDER BY created_on DESC
          LIMIT $2 OFFSET $3
        `;
        queryParams = [userId, limit, offset];
      } else {
        getHistoryQuery = `
          SELECT 
            invoice_number,
            transaction_type,
            description,
            total_amount,
            created_on
          FROM transactions
          WHERE user_id = $1
          ORDER BY created_on DESC
          OFFSET $2
        `;
        queryParams = [userId, offset];
      }

      const historyResult = await client.query(getHistoryQuery, queryParams);

      const records = historyResult.rows.map(row => ({
        invoice_number: row.invoice_number,
        transaction_type: row.transaction_type,
        description: row.description,
        total_amount: parseInt(row.total_amount),
        created_on: row.created_on
      }));

      return res.status(200).json({
        status: 0,
        message: 'Get History Berhasil',
        data: {
          offset: offset,
          limit: limit || records.length,
          records: records
        }
      });

    } catch (error) {
      console.error('Get history error:', error);
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

module.exports = new TransactionController();