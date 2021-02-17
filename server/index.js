const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 3000;
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const pool = require('../DB/index.js');

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '..', 'public')));


app.post('/slackreactor/room', async (req, res) => {
  try {
    const { room_name, users } = req.body;
    const user_id = req.body.message.user_id;
    const first_name = req.body.message.first_name
    const profile_pic = req.body.message.profile_pic
    const post = req.body.message.message

    const text = `{user_id: ${user_id}, first_name: ${first_name}, profile_pic: ${profile_pic}, message: ${post}}`
    const stringified = JSON.stringify(text)
    console.log('text ', text)

    const query = `INSERT INTO Rooms (room_name, messages, users) VALUES('${room_name}', '{${stringified}}', '{${users}}');`

    const newMessage = await pool.query(query);
    res.json(query.rows)
  } catch (err) {
    console.error(err.message)
  }
});

//FRIENDS -NEED TO ADD ANOTHER FRIEND
//ROOMS - ADD ANOTHER ROOM
//UPDATING A ROOM NAME -LOW

app.post('/slackreactor/users', async (req, res) => {
  console.log(req.body)
  try {
    const { room_name, users } = req.body;
    const user_id = req.body.user_id;
    const cohort = req.body.cohort;
    const friends = req.body.friends;
    const staff = req.body.staff;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const profile_pic = req.body.profile_pic;
    const rooms = req.body.rooms;

    const query = `INSERT INTO Users (user_id, cohort, friends, staff, first_name, last_name, profile_pic, rooms) VALUES('${user_id}', '${cohort}', '{${friends}}', '${staff}', '${first_name}', '${last_name}', '${profile_pic}', '{${rooms}}');`

    const newMessage = await pool.query(query);
    res.json(query.rows)
  } catch (err) {
    console.error(err.message)
  }
});

app.put('/slackreactor/users/:id', async (req, res) => {
  const itemToBeUpdated = req.params.id

  if (req.body.rooms) {
    try {
      const body = JSON.stringify(req.body.rooms)
      const formattedBody = body.slice(1, -1);
      const room = '{' + formattedBody + '}'
      const query = `UPDATE Users SET rooms = '${room}' WHERE user_id = '${itemToBeUpdated}'`
      const dbQuery = await pool.query(query);
      res.json(query.rows)
    } catch (err) {
      console.error(err.message)
    }
  }
  if (req.body.friends) {
    try {
      const body = JSON.stringify(req.body.friends)
      const formattedBody = body.slice(1, -1);
      const friends = '{' + formattedBody + '}'
      const query = `UPDATE Users SET friends = '${friends}' WHERE user_id = '${itemToBeUpdated}'`
      const dbQuery = await pool.query(query);
      res.json(query.rows)
    } catch (err) {
      console.error(err.message)
    }
  }

  try {
    const column = Object.keys(req.body)
    console.log(req.body[column])
    console.log(itemToBeUpdated)

    const query = `UPDATE Users SET ${column} = '${req.body[column]}' WHERE user_id = '${itemToBeUpdated}'`
    const dbQuery = await pool.query(query);
    res.json(query.rows)
  } catch (err) {
    console.error(err.message)
  }
});

app.get('/slackreactor/room', async (req, res) => {
  try {
    const product = await pool.query(`SELECT * FROM Rooms LIMIT 10`);
    res.json(product.rows)
  } catch (err) {
    console.error(err.message)
  }
});

app.get('/slackreactor/users', async (req, res) => {
  try {
    const product = await pool.query(`SELECT * FROM Users LIMIT 10`);
    res.json(product.rows)
  } catch (err) {
    console.error(err.message)
  }
});

app.get(/\/(SignUp|MessageApp|Login)/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/index.html'), function (err) {
    if (err) res.status(500).send(err);
  })
})

app.get('/userInfo/:user_id', async (req, res) => {
  try {
    const product = await pool.query(`SELECT * FROM Users WHERE user_id = ${req.params.user_id}`);
    res.json(product.rows)
  } catch (err) {
    console.error(err.message)
  }
});


io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('room', (room) => {
    console.log('user joined room');
    socket.join(room);
  });

  socket.on('add_user', user => {
    socket.emit('server_message', {
      name: user.name,
      message: 'welcome to the server!'
    })

    socket.broadcast.emit('server_message', {
      name: 'server',
      message: `${user.name} joined the chat`
    })

    socket.user = user;
  })

  socket.on('message', ({ room, message }) => {
    console.log(room);
    console.log(message);
    io.to(room).emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  })
});



http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

