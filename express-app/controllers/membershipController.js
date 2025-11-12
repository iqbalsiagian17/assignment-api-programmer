const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

class MembershipController {
  async registration(req, res, next) {
    const client = await pool.connect();
    
    try {
      const { email, first_name, last_name, password } = req.body;

      // Check if user already exists using prepared statement
      const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
      const checkResult = await client.query(checkUserQuery, [email]);

      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          status: 102,
          message: 'Email sudah terdaftar',
          data: null
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const insertQuery = `
        INSERT INTO users (email, first_name, last_name, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      await client.query(insertQuery, [email, first_name, last_name, hashedPassword]);

      return res.status(200).json({
        status: 0,
        message: 'Registrasi berhasil silahkan login',
        data: null
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  async login(req, res, next) {
    const client = await pool.connect();
    
    try {
      const { email, password } = req.body;

      const getUserQuery = `
        SELECT id, email, password, first_name, last_name 
        FROM users 
        WHERE email = $1
      `;
      const result = await client.query(getUserQuery, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 103,
          message: 'Username atau password salah',
          data: null
        });
      }

      const user = result.rows[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 103,
          message: 'Username atau password salah',
          data: null
        });
      }

      const token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        status: 0,
        message: 'Login Sukses',
        data: {
          token: token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  async getProfile(req, res, next) {
    const client = await pool.connect();
    
    try {
      const email = req.userEmail;

      const getUserQuery = `
        SELECT email, first_name, last_name, profile_image 
        FROM users 
        WHERE email = $1
      `;
      const result = await client.query(getUserQuery, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      const user = result.rows[0];

      return res.status(200).json({
        status: 0,
        message: 'Sukses',
        data: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: user.profile_image
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  async updateProfile(req, res, next) {
    const client = await pool.connect();
    
    try {
      const email = req.userEmail;
      const { first_name, last_name } = req.body;

      const updateQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2
        WHERE email = $3
        RETURNING email, first_name, last_name, profile_image
      `;
      
      const result = await client.query(updateQuery, [first_name, last_name, email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      const user = result.rows[0];

      return res.status(200).json({
        status: 0,
        message: 'Update Pofile berhasil',
        data: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: user.profile_image
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error',
        data: null
      });
    } finally {
      client.release();
    }
  }

  async updateProfileImage(req, res, next) {
    const client = await pool.connect();
    
    try {
      const email = req.userEmail;

      if (!req.file) {
        return res.status(400).json({
          status: 102,
          message: 'Format Image tidak sesuai',
          data: null
        });
      }

      const imageUrl = `${process.env.BASE_URL}/${process.env.UPLOAD_DIR}/${req.file.filename}`;

      const getOldImageQuery = 'SELECT profile_image FROM users WHERE email = $1';
      const oldImageResult = await client.query(getOldImageQuery, [email]);

      const updateQuery = `
        UPDATE users 
        SET profile_image = $1
        WHERE email = $2
        RETURNING email, first_name, last_name, profile_image
      `;
      
      const result = await client.query(updateQuery, [imageUrl, email]);

      if (result.rows.length === 0) {
        fs.unlinkSync(req.file.path);
        
        return res.status(401).json({
          status: 108,
          message: 'Token tidak tidak valid atau kadaluwarsa',
          data: null
        });
      }

      if (oldImageResult.rows.length > 0) {
        const oldImageUrl = oldImageResult.rows[0].profile_image;
        if (oldImageUrl && !oldImageUrl.includes('profile.jpeg')) {
          const oldImagePath = oldImageUrl.replace(`${process.env.BASE_URL}/`, '');
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }

      const user = result.rows[0];

      return res.status(200).json({
        status: 0,
        message: 'Update Profile Image berhasil',
        data: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: user.profile_image
        }
      });

    } catch (error) {
      console.error('Update profile image error:', error);
      
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

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

module.exports = new MembershipController();