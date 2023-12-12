const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const app = express();
const DatabaseService = require('./database/database.js');
const PinsRouter = require('./routes/pins.js');
const AuthRouter = require('./routes/auth.js');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer 配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

let users = [];

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/profile', (req, res) => {
  res.render('pages/profile', { users });
});

app.get('/login', (req, res) => {
  res.render('auth/login', { users });
});

app.get('/register', (req, res) => {
  res.render('auth/register', { users });
});

app.get('/article1', (req, res) => {
  res.render('pages/article1');
});

app.get('/article2', (req, res) => {
  res.render('pages/article2');
});

app.get('/article3', (req, res) => {
  res.render('pages/article3');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', upload.single('profileImage'), async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const profileImage = req.file ? req.file.filename : 'default.jpg';

    // Check if the user already exists
    const userExists = users.some((user) => user.email === email);
    if (userExists) {
      return res.render('signup', { error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profileImage,
    };

    // Add the user to the list
    users.push(newUser);

    // Redirect to the profile page
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = users.find((user) => user.email === email);

    if (!user) {
      return res.render('index', { error: 'Invalid email or password' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('index', { error: 'Invalid email or password' });
    }

    // Redirect to the profile page
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.delete('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;

    // Find the index of the user to delete
    const userIndex = users.findIndex((user) => user.email === email);

    if (userIndex === -1) {
      return res.status(404).send('User not found');
    }

    // Remove the user from the list
    users.splice(userIndex, 1);

    // Delete the user's profile image
    const userToDelete = users[userIndex];
    if (userToDelete.profileImage !== 'default.jpg') {
      await fs.unlink(path.join(__dirname, 'public', 'uploads', userToDelete.profileImage));
    }

    // Redirect to the profile page
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// 设置端口并启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
