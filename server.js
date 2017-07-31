const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB Connected');

    // Connect to socket.io
    client.on('connect', function(socket){
        console.log(socket.id)
        let chat = db.collection('chats');
        
        // Create function to send status for socket
        // Previous Bug: Miss let in previous version, which causes "sendStatus" 
        // because a global variable under the "window".
        let sendStatus = function(info){
            socket.emit('status', info);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
            if(err){
                throw err;
            }
            
            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            console.log(socket.id + "send a message to the server")
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name === '' || message === ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message Sent',
                        clear: true
                    })
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});
