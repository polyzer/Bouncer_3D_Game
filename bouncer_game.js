
var _Game = function (json_params) 
{
	// подготовка
	this.Container = document.createElement("div");
	this.Container.setAttribute("id", "MainContainer");
	document.body.appendChild(this.Container);

	this.Scene = new THREE.Scene();

	this.CameraParameters = json_params.camera_parameters;

	this.Camera = new THREE.PerspectiveCamera(
		this.CameraParameters.ANGLE, 
		this.CameraParameters.SCREEN_WIDTH/this.CameraParameters.SCREEN_HEIGHT, 
		this.CameraParameters.NEAR, 
		this.CameraParameters.FAR
	);
	
	this.SkyBox = {};
	this.SkyBox.Geometry = new THREE.BoxGeometry(10000, 10000, 10000);
	this.SkyBox.Material = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
	this.SkyBox.Mesh = new THREE.Mesh(this.SkyBox.Geometry, this.SkyBox.Material);
	this.Scene.add(this.SkyBox.Mesh);																						
																						
	this.Renderer = new THREE.WebGLRenderer();
	this.Renderer.setSize(this.CameraParameters.SCREEN_WIDTH, this.CameraParameters.SCREEN_HEIGHT);
	
	this.Container.appendChild(this.Renderer.domElement);
	
	this.Clock = new THREE.Clock();
	
	this.Body = json_params.body;
	
// ВНИМАНИЕ: В игре используется глобальный объект		
	this.NetMessagesObject = new _NetMessages({nickname: this.Nickname, id: this.ID});
	
	// Список удаленных игроков;
	this.RemoteUsers = [];
 
  // Локальный игрок
	this.LocalUser = null;
	/*Все игроки в системе.
	[0] - LocalUser;
	[1] - RemoteUsers - удаленные игроки
  структура, хранящая всех игроков, включая локального;	
	*/
	this.AllUsers = [];
	/*Идентификатор комнаты будет устанавливаться,
		когда пользователь будет в комнате;
	*/
	this.RoomID = null;
	if(json_params.room_id !== undefined)
		this.setRoomID(json_params.room_id);
	this.Peer = json_params.peer;
		
	this.createUsersByExistingConnectionsBF = this.createUsersByExistingConnections.bind(this);
	this.updateWorkingProcessBF = this.updateWorkingProcess.bind(this);
	this.createUserByRecievedConnectionBF = this.createUserByRecievedConnection.bind(this);
	this.onCallBF = this.onCall.bind(this);
			
  this.onOpenInitAndStartGame();
};		


/*Обрабатывает медиапотоки, присылваемые другими пользователями,
 *и присваивает их нужным пользователям!
 */
_Game.prototype.onCall = function (call)
{
	for(var i=0; i<this.AllUsers[1].length; i++)
	{
		call.answer(Stream);
		if(this.AllUsers[1][i].getPeerID() === call.peer)
			this.AllUsers[1][i].onCall(call);
	}
};


/* Инициализирует начало работы Peer.js
 */
_Game.prototype.onOpenInitAndStartGame = function (e)
{
	this.AllUsers.push(this.LocalUser);
	this.AllUsers.push(this.RemoteUsers);
	
  	// Устанавливаем обработчика событий
	this.Peer.on('connection', this.createUserByRecievedConnectionBF);
  	this.Peer.on('call', this.onCallBF);
	// Локальный игрок, который будет
	this.LocalUser = new _LocalUser({
		scene: this.Scene, 
		all_users: this.AllUsers, 
		net_messages_object: this.NetMessagesObject,
		camera: this.Camera,
		game_width: this.GameWidth,
		game_height: this.GameHeight,
		body: this.Body
	});
	
	this.getAndSetInitConnections();

	this.startWorkingProcess();

};

/* Важнейшая функция.
 * Создает соединения с пользователями, которые уже
 * находятся в сети.
 * Принимает на вход:
 * json_params: {response: [ids]}
 */
_Game.prototype.createUsersByExistingConnections = function (json_params)
{
	alert(json_params);
	if(json_params === "undefined")
	{
		throw new Error(this.constructor.name + ".createUsersByExistingConnections(json_response) - have no json_response");
		return;
	}
	
	if(typeof(json_params) === "string")
	{
		json_params = JSON.parse(json_params);
	}
	for(var i=0; i<json_params.response.length; i++)
	{
		// на сервере уже будет установлено наше соединение;
		// а сами к себе мы подсоединяться не должны!
		if(this.Peer.id === json_params.response[i])
		{
			continue;
		}
		conn = this.Peer.connect(json_params.response[i]);
		alert(StreamObj);
		this.Peer.call(json_params.response[i], StreamObj);///////////////////////////////////////////???????!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		this.RemoteUsers.push(new _RemoteUser({
				net_messages_object: this.NetMessagesObject,
				all_users: this.AllUsers,
				scene: this.Scene,
				connection: conn
			}));
	}

};

/* Важнейшая функция игры, в которой происходит управление и обновление всех систем!!
 */

_Game.prototype.updateWorkingProcess = function ()
{
		this.Renderer.render(this.Scene, this.Camera);
		this.LocalUser.update();
		this.updateRemoteUsers();

	  requestAnimationFrame(this.updateWorkingProcessBF);
}

/* Производит обновление телодвижений удаленных игроков.
 */
_Game.prototype.updateRemoteUsers = function ()
{
		for(var j=0; j<this.RemoteUsers.length; j++)
	  {
			this.RemoteUsers[j].update();
		}
}

_Game.prototype.setRoomID = function(id)
{
	this.RoomID = id;
}

/*
	Получает список находящихся в комнате пользователей,
	и создает с ними соединения.
*/
_Game.prototype.getAndSetInitConnections = function (json_params)
{
	if(this.RoomID === null)
	{
		throw new Error("Problem with room_id in function getAndSetInitConnections");
		return;
	}
	
	req_str = SERVER_REQUEST_ADDR  + "/" + REQUESTS.UTOS.COME_INTO_ROOM;
	$.ajax({
		type:"POST",
		url: req_str,
		async: false,
		crossDomain: true,
		data: {room_id : this.RoomID, user_id: this.Peer.id},
		success: this.createUsersByExistingConnectionsBF
	});
}

/* функция добавляет полученное соединение в массив соединений Connections
 * и сразу отправляет запрос на получение nickname нового игрока
 */
_Game.prototype.createUserByRecievedConnection = function (conn)
{
	this.RemoteUsers.push(new _RemoteUser({
								connection: conn,
								scene: this.Scene,
								all_users: this.AllUsers,
								net_messages_object: this.NetMessagesObject													
					   }));
};


/* завершаем соединение с игроком
 */
_Game.prototype.disconnectRemoteUsers = function()
{
	while(this.RemoteUsers.length > 0)
	{
		this.RemoteUsers[this.RemoteUsers.length-1].Conection.close();
		this.RemoteUsers.pop();
	}
};
/*Устанавливает Nickname во всех необходимых структурах
*/
_Game.prototype.setNickname = function (nickname)
{
	this.Nickname = nickname;
	this.NetMessagesObject.setNickname(nickname);
}

_Game.prototype.startWorkingProcess = function ()
{
		requestAnimationFrame(this.updateWorkingProcessBF);	
}
