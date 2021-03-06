const server = require('net').createServer();
getIp();
async function getIp() {
  let promise = new Promise((resolve, reject) => {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
      resolve(add);
    });
  });
  let currentIp = await promise;
  let PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server started on IP: ${currentIp}:${PORT}`));
}

let counter = 0;
const connections = {};

server.on('connection', (socket) => {
  console.log(`New connection attempted.`);

  socket.id = counter++;
  socket.write('\033c Enter your name to join:\n> ');

  socket.on('data', message => {

    // First time joiners
    if (!connections[socket.id]) {
      socket.name = message.toString().trim();
      socket.write(`${'~'.repeat(message.length + 8)}\nWelcome, ${message}${'~'.repeat(message.length + 8)} \nYour chat is private. But your chat name is logged.\n`);

      let previousMembers = [];
      Object.keys(connections).forEach((key) => {
        connections[key].write(`${socket.name} has joined.\n> `);
        previousMembers.push(connections[key].name);
      });
      if (previousMembers.length) {
        socket.write(`Participants (${previousMembers.length}): ${previousMembers.join(', ')}\n> `);
      } else {
        socket.write(`Nobody has joined yet.\n> `);
      }

      connections[socket.id] = socket;
      console.log(`${socket.name} has joined. Total participants(${Object.keys(connections).length})`);
      return;
    }

    // While receiving messages
    Object.keys(connections).forEach((key) => {
      if (key != socket.id) {
        let printTime = (new Date).toString().split(' ')[4];
        connections[key].write(`${socket.name}(${printTime}): ${message}\n> `);
      }
    });

  });

  // Exiting a chat
  socket.on('end', () => {
    delete connections[socket.id];
    if(socket.name){
      Object.keys(connections).forEach((key) => {
        connections[key].write(`${socket.name} left. Total participants(${Object.keys(connections).length})\n> `);
      })
      console.log(`${socket.name} left. Total participants(${Object.keys(connections).length})`);  
    }
    
  });
});