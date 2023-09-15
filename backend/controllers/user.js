const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { encrypt, decrypt } = require("../utils/confirmation");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    "{{OAUTH_CLIENT_ID}}",
    "{{OAUTH_CLIENT_SECRET}}",
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_Token: "{{OAUTH_REFRESH_TOKEN}}",
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token);
    });
  });

  const Transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "{{GMAIL_EMAIL}}",
      accessToken,
      clientId: "{{OAUTH_CLIENT_ID}}",
      clientSecret: "{{OAUTH_CLIENT_SECRET}}",
      refreshToken: "{{OAUTH_REFRESH_TOKEN}}",
    },
  });

  return Transport;
};

const sendEmail = async ({ email, username, res }) => {
  const confirmationToken = encrypt(username);
  const apiUrl = process.env.API_URL || "http://0.0.0.0:4000";

  const Transport = await createTransporter();

  //configuring email options
  const mailOptions = {
    from: "Educative Fullstack Course",
    to: email,
    subject: "Email Confirmation",
    html: `Press the following link to verify your email: <a href=${apiUrl}/confirmation/${confirmationToken}>Verification Link</a>`,
  };

  //sending email
  Transport.sendMail(mailOptions, function (error, response) {
    if (error) {
      res.status(400).send(error);
    } else {
      res.status(201).json({
        message: "Account created successfully please check your email.",
      });
    }
  });
};

exports.verify = async (req, res) => {
  try {
    const { confirmationToken } = req.params;

    const username = decrypt(confirmationToken);

    const user = await User.findOne({ username: username });

    if (user) {
      user.isVerified = true;
      await user.save();
      res.status(200).send({ message: "Account verified successfully" });
    } else {
      return res.status(400).send({ message: "Invalid verification token" });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
};

exports.signup = async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { firstName, lastName, username, email, password } = req.body;

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res
        .status(409)
        .send({ message: "User Already Exist. Please Login" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    //create an user
    let user = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_SECRET_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
};
