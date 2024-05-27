const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('../libs/nodemailer');
const { createUpdateotp } = require('./otp.controllers');

const { JWT_SECRET_KEY } = process.env;

module.exports = {
  // melakukan register
  register: async (req, res, next) => {
    try {
      let { nama, email, no_telp, password, ConfirmationPassword, role } =
        req.body;

      let userExist = await prisma.account.findUnique({ where: { email } });

      //email sudah pernah digunakan
      if (userExist) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'akun anda sudah terdaftar',
          data: null,
        });
      }

      //validasi password & confirmation password
      if (password != ConfirmationPassword) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Password & Password Confirmation must be same!',
          data: null,
        });
      }
      //validasi panjang nama maksimal 50 karakter
      if (nama.length > 50) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Nama harus memiliki maksimal 50 karakter',
          data: null,
        });
      }

      //validasi panjang password minimal 8 karakter dan maksimal 15 karakter
      if (password.length < 8 || password.length > 15) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error:
            'Password harus memiliki minimal 8 karakter dan maksimal 15 karakter',
          data: null,
        });
      }

      // Validasi format email menggunakan regular expression
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Format email tidak valid',
          data: null,
        });
      }
      let PictDefault = 'https://cdn.discordapp.com/attachments/1051821717804302357/1189572569590943794/default-avatar.png?ex=659ea6c9&is=658c31c9&hm=6e02132f4471d66da1822b29c3cc1aca509a46f4f4783ac34335c95d7020dd73&'
      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.account.create({
        data: {
          nama,
          email,
          no_telp,
          password: encryptedPassword,
          role,
          url_image: PictDefault
        },
      });

      //set token for otp
      let token = jwt.sign(
        { account_id: user.account_id, email: user.email },
        JWT_SECRET_KEY
      );

      //generate otp
      await createUpdateotp(user.account_id, user.nama, user.email, res);

      // Set the email in response headers
      res.set('userEmail', user.email);
      res.cookie('userToken', token);

      // Mengembalikan respon terlebih dahulu
      res.status(201).json({
        status: true,
        message:
          'Registrasi berhasil, silakan cek email untuk mendapatkan OTP.',
        data: {
          token,
          user: {
            nama: user.nama,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified,
          },
        },
      });

      //   res.redirect('/verify-otp'); // Redirect to verify otp page
    } catch (err) {
      next(err);
    }
  },

  // verify otp
  verifyOtp: async (req, res, next) => {
    try {
      const { otp } = req.body;
      let { email } = req.user;

      //err find user dihandle oleh restrict

      if (!otp) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'OTP are required',
          data: null,
        });
      }
      let activationOtp = await prisma.otp.findFirst({
        where: {
          otp,
        },
      });
      if (!activationOtp) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'Invalid Activation Code or Code Expired',
          data: null,
        });
      }
      await prisma.otp.update({
        where: {
          account_id: activationOtp.account_id,
        },
        data: {
          otp: null,
        },
      });
      let { is_verified } = await prisma.account.update({
        where: {
          email,
        },
        data: {
          is_verified: true,
        },
      });

      //create Notification
      let titleNotif = 'Success Registrasi Akun!';
      let deskNotif = `Congratulations ${email} on successfully verifying your account!`;
      await prisma.notifikasi.create({
        data: {
          account_id: activationOtp.account_id,
          title: titleNotif,
          deskripsi: deskNotif,
        },
      });

      return res.status(200).json({
        status: true,
        message: 'Activation Code verified successfully',
        err: null,
        data: { email, otp, is_verified },
      });
      // });

      //   res.redirect('/user/login'); // Redirect to login page
    } catch (err) {
      next(err);
    }
  },

  // resend otp
  resendOtp: async (req, res, next) => {
    try {
      let { email } = req.user;

      //err find user dihandle oleh restrict

      const user = await prisma.account.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'Not Found',
          err: 'User not found',
          data: null,
        });
      }
      // Mengambil nilai OTP dari database
      const existingOTP = await prisma.otp.findUnique({
        where: { account_id: user.account_id },
      });

      if (!existingOTP) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'OTP not found for the user',
          data: null,
        });
      }

      // Memperbarui nilai OTP dalam model
      const updateOtp = existingOTP.otp;
      // create or update OTP in the Otp table
      await prisma.otp.upsert({
        where: { account_id: user.account_id },
        create: {
          account_id: user.account_id,
          otp: updateOtp,
          created_at: new Date(),
        },
        update: {
          otp: updateOtp,
          created_at: new Date(),
        },
      });

      // send otp
      await createUpdateotp(user.account_id, user.nama, user.email, res);
      return res.status(200).json({
        status: true,
        message: 'OTP resent successfully',
        err: null,
        data: { email: user.email },
      });
      // });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const user = await prisma.account.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Invalid Email or Password',
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Invalid Email or Password',
        });
      }

      const userVerified = await prisma.account.findUnique({
        where: { email, is_verified: true },
      });

      if (!userVerified) {
        //generate otp
        createUpdateotp(user.account_id, user.nama, user.email, res);
        return res.status(401).json({
          status: false,
          err: 'lakukan verifikasi terlebih dahulu',
          message: 'harap periksa email anda untuk mendapat otp',
          data: { email: user.email, is_verified: user.is_verified },
        });
      } else {
        const token = jwt.sign(
          { id: user.account_id, email: user.email },
          JWT_SECRET_KEY
        );

        res.cookie('token', token, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30 * 1000,
        });

        // bisa redirect kalau sudah login ke sini
        //res.redirect(`/home);
        return res.status(200).json({
          status: true,
          message: 'Berhasil login',
          data: { user, token },
        });
      }
    } catch (err) {
      next(err);
    }
  },
  resetPassword: async (req, res, next) => {
    try {
      let { email } = req.body;
      let emailExist = await prisma.account.findUnique({
        where: { email },
      });
      if (!emailExist) {
        return res.status(400).json({
          status: false,
          message: 'Email Not Found',
          err: 'Enter Regisreted Email!',
          data: null,
        });
      }

      let token = jwt.sign({ account_id: emailExist.account_id, email: emailExist.email }, JWT_SECRET_KEY);
      var location = req.headers.host; //get HOST & PORT
      // let url = `${location}/auth/reset-password?token=${token}`; //send token in link to get user
      let url = `<p>Hi ${email}, ini adalah token Anda: <strong>${location}/auth/reset-password?token=${token}</strong></p>`; //send token in link to get user
      // const html = await nodemailer.getHtml('reset-password-valid.ejs', {
      //   email,
      //   url,
      // });

      nodemailer.sendEmail(email, 'Reset Password', url);

      //create Notification
      let titleNotif = 'Request Reset Password Detected!';
      let deskNotif = `Request Password Reset in email ${email} has been detected!, please check your email to proceed to the next step or ignore this message if that's not you`;

      await prisma.notifikasi.create({
        data: {
          account_id: emailExist.account_id,
          title: titleNotif,
          deskripsi: deskNotif,
        },
      });

      return res.status(200).json({
        status: true,
        message: 'Send',
        err: null,
        data: { email },
      });
    } catch (err) {
      next(err);
    }
  },
  changePassword: async (req, res, next) => {
    try {
      let { password, confirmationPassword } = req.body;
      let { token } = req.query;
      if (password != confirmationPassword) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'please ensure that the password and password confirmation match!',
          data: null,
        });
      }

      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            status: false,
            message: 'Bad Request',
            err: err.message,
            data: null,
          });
        }
        let encryptedPassword = await bcrypt.hash(password, 10);
        let updated = await prisma.account.update({
          where: { email: decoded.email },
          data: { password: encryptedPassword },
        });

        //create Notification
        let titleNotif = 'SUCCESSFULLY CHANGING YOUR PASSWORD!';
        let deskNotif = `Congratulations ${decoded.email} You have successfully changed your password, please log in using your new password!`;

        await prisma.notifikasi.create({
          data: {
            account_id: decoded.account_id,
            title: titleNotif,
            deskripsi: deskNotif,
          },
        });
        
        res.status(200).json({
          status: true,
          message: 'success',
          err: null,
          data: {
            user: {
              nama: updated.nama,
              email: updated.email,
              role: updated.role,
            },
          },
        });
      });
    } catch (err) {
      next(err);
    }
  },
  whoami: async (req, res, next) => {
    let account = req.user
    let courseId = []

    let listCourse = await prisma.user_course.findMany({
      where: {account_id : account.account_id}
    })

    listCourse.forEach((c)=>{
      courseId.push({course_id : c.course_id})
    })
    return res.status(200).json({
      status: true,
      message: 'OK',
      err: null,
      data: { user: account, listCourse:courseId},
    });
  },
};
