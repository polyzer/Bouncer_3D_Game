/* Класс описывает локального игрока.
 * Класс должен ОБЯЗАТЕЛЬНО принять необходимые параметры в формате JSON:
 * {
 *   player_type: type - тип игрока, фиксирован....
 *   all_players: Game.Players, - содержит список удаленных игроков, чтобы отсылать им данные
 *   scene: THREE.Scene(); - объект сцены, в которую нужно будет добавить свой корабль
 * }
 */
var _LocalPlayer = function (json_params)
{
	if(json_params !== undefined)
	{
		this.Scene = json_params.scene;
		this.PlayerType = "local";
		this.AllPlayers = json_params.all_players;
		this.Body = json_params.body;
		this.NetMessagesObject = json_params.net_messages_object;
		this.Camera = json_params.camera;
		this.Ship = new _PlayerShip({scene: json_params.scene, camera: this.Camera});

		
		this.GameWidth = json_params.game_width;
		this.GameHeight = json_params.game_height;
		
		this.Controls = new THREE.FlyControls(this.Ship.getMesh());
		this.Controls.movementSpeed = 70;
		this.Controls.rollSpeed = Math.PI / 24;
		this.Controls.autoForward = false;
		this.Controls.dragToLook = false;
		
		this.Raycaster = new THREE.Raycaster();
		this.MouseVector = new THREE.Vector2();
		this.INTERSECTED = null;
		

	}else
		console.log(this.constructor.name + " have no json_params!");

	this.onMouseMoveBF = this.onMouseMove.bind(this);
	window.addEventListener("mousemove", this.onMouseMoveBF, false);

	this.onClickBF = this.onClick.bind(this);
	window.addEventListener("click", this.onClickBF, false);
		
};

_LocalPlayer.prototype.onMouseMove = function (event)
{
	this.MouseVector.x = (event.clientX / this.GameWidth) * 2 - 1;
	this.MouseVector.y = -(event.clientY / this.GameHeight) * 2 + 1;
};

_LocalPlayer.prototype.onClick = function ()
{
//	console.log(this.Raycaster.ray.direction);
	// собираем параметры, необходимые для выстрела в единую структуру
	var data = this.setDataParameters({
		direction: this.Raycaster.ray.direction.clone(),
		gun_type: "plasma_gun",
		bullet_type: "cube_green_bullet"	
	});
	// сначала отправляем данные!
	this.NetMessagesObject.ShootMessage.data = data;
	console.log(data);
	this.sendDataToAllRemotePlayers(this.NetMessagesObject.ShootMessage);
	var shoot_data = $.extend(true, {}, data);
	// теперь стреляем сами!
	shoot_data.all_players = this.AllPlayers;
	shoot_data.owner_id = this.ID;
	this.Ship.shoot(shoot_data);
};

/*Функция устанавливает параметры для запроса для произведения выстрела 
 * и отправки запроса другим игрокам
 * IN:
 * json_params{
 *  gun_type: type
 * }
 *
 * OUT:
 * ret_params{
 *  distance: json_params.parameters.distance,
 * 	speed: json_params.parameters.speed,
 * 	direction: json_params.direction,
 * 	start_position: json_params.parameters.start_position,
 *	gun_type: "gun_type"			
 * }
 * 
 */

_LocalPlayer.prototype.setDataParameters = function (json_params)
{
	var ret_params = this.Ship.getBulletParametersByGunAndBulletTypes(json_params);
	ret_params.direction = json_params.direction;
	return ret_params;
};

/*Вызывается,когда мы должны переслать всем  
 *перемещения/стрельбы и присылает данные об этом
 * MoveMessage | ShootMessage (класс _NetMessages);
 * Локальный игрок не должен принимать данные, он их только отсылает
 * остальным участникам игры;
 */
_LocalPlayer.prototype.sendDataToAllRemotePlayers = function (message)
{
	if(typeof(message) !== "string")
	{
		message = JSON.stringify(message);
	}
	for(var i=0;i < this.AllPlayers[1].length; i++)
	{
		if(this.AllPlayers[1][i].ConnectionStatus === "open")
			this.AllPlayers[1][i].Connection.send(message);
	}
};

/*Обновляет данные в объекте сообщений, которые будут отправляться другим
 *пользователям при перемещении
 * 
 */
_LocalPlayer.prototype.updateMessages = function ()
{
	this.NetMessagesObject.setPositionDataFromMesh(this.Ship.getMesh());
};

_LocalPlayer.prototype.raycastingControl = function ()
{
	
	this.Raycaster.setFromCamera(this.MouseVector, this.Camera);

	var intersects = this.Raycaster.intersectObjects(this.Scene.children);
	if (intersects.length > 0)
	{
		if(this.INTERSECTED != intersects[0].object)
		{
			if(this.INTERSECTED)
				this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
			this.INTERSECTED = intersects[0].object;
			this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
			this.INTERSECTED.material.emissive.setHex(0xff0000);
		}			
	}else
	{
		if (this.INTERSECTED)
			this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
		this.INTERSECTED = null;
	}
	
};

/* Обновляет все необходимые объекты и проводит вычисления
 */
_LocalPlayer.prototype.update = function ()
{
	this.raycastingControl();
	this.Ship.Life();
	
	this.Controls.update(0.1);
	this.updateMessages();
	this.sendDataToAllRemotePlayers(this.NetMessagesObject.MoveMessage);
	
};


_LocalPlayer.prototype.getMesh = function ()
{
	return this.Ship.getMesh();
};

_LocalPlayer.prototype.getShip = function ()
{
	return this.Ship;
};

// Вызывается для установки видеотекстуры удаленного игрока.
_LocalPlayer.prototype.setVideoTexture = function()
{
		this.Video = document.createElement("video");;
		this.Video.autoplay = 1;
		this.Video.width = 160;
		this.Video.height = 120;
		this.Video.style.visibility = "hidden";
		this.Video.style.float = "left";
		
		this.VideoImage = document.createElement("canvas");
		this.VideoImage.width = 160;
		this.VideoImage.height = 120;
		this.VideoImage.style.visibility = "hidden";
		this.VideoImage.style.float = "left";

		this.VideoImageContext = this.VideoImage.getContext("2d");
		// background color if no video present
		this.VideoImageContext.fillStyle = "#00FF00";
		this.VideoImageContext.fillRect( 0, 0, this.VideoImage.width, this.VideoImage.height );

		this.VideoTexture = new THREE.Texture( this.VideoImage );
		this.VideoTexture.minFilter = THREE.LinearFilter;
		this.VideoTexture.magFilter = THREE.LinearFilter;
		this.Ship.setTextureAndUpdateMesh(this.VideoTexture);
};

/* Класс описывает игрока.
 * Класс должен ОБЯЗАТЕЛЬНО принять необходимые параметры в формате JSON:
 * {
 *   net_messages_object: nmo,		
 *   connection: connection, - соединение, из которого будут приходить данные, и в которое будут данные отправляться
 *   scene: THREE.Scene(); - объект сцены, в которую нужно будет добавить свой корабль,
 *   random: true | false
 * }
 * Класс удаленного игрока обрабатывает только входящие сообщения, но НИЧЕГО НЕ ОТСЫЛАЕТ!
 * 
 */

var _RemotePlayer = function (json_params)
{
	if(json_params !== undefined)
	{
		this.PlayerType = "remote";
		this.Scene = json_params.scene;		
		this.Connection = json_params.connection;
		this.NetMessagesObject = json_params.net_messages_object;
		this.AllPlayers = json_params.all_players;
		this.Ship = new _PlayerShip({scene: this.Scene, random: true});
		this.ConnectionStatus = "null";
		this.ID = json_params.id;
		
	}else
		throw new Error(this.constructor.name + " have no json_params!");
  
	this.onOpenConnectionBF = this.onOpenConnection.bind(this);
	this.Connection.on("open", this.onOpenConnectionBF);
	
	this.onDataRecievedFunc = this.onDataRecieved.bind(this); 
	this.Connection.on("data",  this.onDataRecievedFunc);

	this.onCloseConnectionFunc = this.disconnect.bind(this); 
	this.Connection.on("close", this.onCloseConnectionFunc);  

	this.onConnectionErrorFunc = this.onConnectionError.bind(this); 
	this.Connection.on("error", this.onConnectionErrorFunc);

};

/* при открытии соединения!
 */
_RemotePlayer.prototype.onOpenConnection = function()
{
	this.Connection.send(JSON.stringify(this.NetMessagesObject.GetNickNameMessage));
	this.ConnectionStatus = "open";
};

/* завершаем соединение с игроком
 */
_RemotePlayer.prototype.disconnect = function()
{
	this.Connection.close();
	this.ConnectionStatus = "closed";
	this.removeShipFromScene();
	console.log("connection was closed");
};

_RemotePlayer.prototype.onConnectionError = function(error)
{
	this.disconnect();
	this.ConnectionStatus = "closed";
	this.removeShipFromScene();
	console.log("Had " + error + " on: " +this.constructor.name + ".onConnectionError()");
};

_RemotePlayer.prototype.removeShipFromScene = function ()
{
	this.Ship.removeMesh();
};
/*Вызывается, когда удаленный игрок совершает действия типа 
 *перемещения/стрельбы и присылает данные об этом
 * MoveMessage | ShootMessage (класс _NetMessages)
 */  
_RemotePlayer.prototype.onDataRecieved = function (json_params)
{
	// преобразуем полученные данные, если они не преобразованы в объект
	if(typeof(json_params) === "string")
	{
		json_params = JSON.parse(json_params);
	}
	// если игрок переместился
	if(json_params.request === "move")
	{
		this.Ship.setPosition(json_params.data.position);
		this.Ship.setRotation(json_params.data.rotation);
		//this.Ship.lookAt(data.look_at);
	} else 
	// если игрок выстрелил
	if(json_params.request === "shoot")
	{
		json_params.data.all_players = this.AllPlayers;
		json_params.data.owner_id = this.ID;
		this.Ship.shoot(json_params.data);
	} else 
	// если игрок прислал свой Nickname
	if(json_params.request === "send_nickname")
	{
		this.Nickname = json_params.data.nickname;
		this.ID = json_params.data.id;
	} else 
	// если данный удаленный игрок хочет получить NICKNAME ЛОКАЛЬНОГО ИГРОКА!!!!!!!!!!!!!!!!
	if(json_params.request === "get_nickname")
	{
		this.Nickname = json_params.data.requested_player_nickname;
		this.ID = json_params.data.requested_player_id;
		this.Connection.send(JSON.stringify(this.NetMessagesObject.SendNickNameMessage));
	}
};

_RemotePlayer.prototype.update = function ()
{
	this.Ship.Life();
};

_RemotePlayer.prototype.getMesh = function ()
{
	return this.Ship.getMesh();
};

_RemotePlayer.prototype.getShip = function ()
{
	return this.Ship;
};

// Вызывается для установки видеотекстуры удаленного игрока.
_RemotePlayer.prototype.setVideoTexture = function()
{
		this.Video = document.createElement("video");;
		this.Video.autoplay = 1;
		this.Video.width = 160;
		this.Video.height = 120;
		this.Video.style.visibility = "hidden";
		this.Video.style.float = "left";
		
		this.VideoImage = document.createElement("canvas");
		this.VideoImage.width = 160;
		this.VideoImage.height = 120;
		this.VideoImage.style.visibility = "hidden";
		this.VideoImage.style.float = "left";

		this.VideoImageContext = this.VideoImage.getContext("2d");
		// background color if no video present
		this.VideoImageContext.fillStyle = "#00FF00";
		this.VideoImageContext.fillRect( 0, 0, this.VideoImage.width, this.VideoImage.height );

		this.VideoTexture = new THREE.Texture( this.VideoImage );
		this.VideoTexture.minFilter = THREE.LinearFilter;
		this.VideoTexture.magFilter = THREE.LinearFilter;
		this.Ship.setTextureAndUpdateMesh(this.VideoTexture);
};
