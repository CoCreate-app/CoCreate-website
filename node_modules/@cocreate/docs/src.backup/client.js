
const CoCreateSocket = require('./CoCreate-socket')

const config = {
	apiKey: 'c2b08663-06e3-440c-ef6f-13978b42883a',
		organization_Id: '5de0387b12e200ea63204d6c'
}

CoCreateSocket.create({
	namespace: config.organization_Id,
	room: null,
	host: 'server.cocreate.app:8088'
})

CoCreateSocket.setGlobalScope(config.organization_Id);

CoCreateSocket.send('sendMessage', {
	broadcast_sender: true,
	broadcast: false,
	emit: {
		message: 'testClient',
		data: 'Sent & Received the ws client using nodejs'
	}
})

CoCreateSocket.listen('testClient', function(data) {
	console.log('--------------------------------')
	console.log('---------- Received ------------')
	console.log(data);

})


CoCreateSocket.send('updateDocument', updateRequsetObject)

CoCreateSocket.listen('updateDocument', function(data) {
	//. process after receive update document result
})

