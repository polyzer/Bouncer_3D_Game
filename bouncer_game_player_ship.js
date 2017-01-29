/*
 * Класс описывает куб, которым будет управлять игрок (удаленный - remote, местный - local)
 * В объект может передаваться камера - в случае, когда кораблем управляет локальный игрок
 * Для удаленного игрока передавать камеру не нужно!
 * */


var _QBorgGamePlayerShip = function (json_params)
{	
	this.Geometry = new THREE.BoxBufferGeometry(200, 200, 200);
	this.Material = new THREE.MeshStandardMaterial({emissive: "#57d9ff"});
	
	this.Status = "live"; // ("live", "dead")
	
	this.Scene = null;
	this.Health = 500; // 
	this.Camera = null;
		
	if(json_params !== undefined)
	{
		
		if(json_params.position !== undefined)
		{
			this.Mesh.position.set(json_params.position);
		}

		if(json_params.scene !== undefined)
		{
			this.Scene = json_params.scene;
		}
		if(json_params.camera !== undefined)
		{
			this.Camera = json_params.camera;
		}

	}

	this.PlasmaGun = new _PlasmaGun({scene: this.Scene});

	// Для локального игрока
	if(this.Camera !== null)
	{
		this.ShipMesh = new THREE.Mesh(this.Geometry, this.Material);		
		this.Mesh = new THREE.Object3D();
		this.Mesh.position.set(0,0,0);
		this.ShipMesh.position.set(0, 0, 0);
		this.BBox = new THREE.BoundingBoxHelper(this.ShipMesh, 0x00ff00);	
		
		this.Camera.position.copy(this.ShipMesh.position);
		
		this.Camera.position.y = this.ShipMesh.position.y + 400;
		this.Camera.position.z = this.ShipMesh.position.z + 400;
		var vec = this.Mesh.getWorldDirection();
		vec.z -= 400;
		this.Camera.lookAt(vec);
		this.Mesh.add(this.ShipMesh);
		this.Mesh.add(this.Camera);
	}	else
	// Для удаленного игрока
	{
		this.Mesh = new THREE.Mesh(this.Geometry, this.Material);
		this.BBox = new THREE.BoundingBoxHelper(this.Mesh, 0x00ff00);	
	}
	
	if(json_params.random !== undefined)
	{
		this.setRandomPosition();
	} else
	{
		this.Mesh.position.set(0,0,0);
	}
	
	this.Scene.add(this.Mesh);
//	this.Scene.add(this.BBox);

};

/*Функция возвращает стандартные параметры с установленным параметром position;
 */

_QBorgGamePlayerShip.prototype.getBulletParametersByGunAndBulletTypes = function (json_params)
{
	var ret = {};
	if(json_params.gun_type === "plasma_gun")
	{
		ret = this.PlasmaGun.getBulletParametersByBulletType(json_params);
		ret.gun_type = "plasma_gun";
		ret.start_position = this.getPosition();
		return ret;
	}
};

_QBorgGamePlayerShip.prototype.setRandomPosition = function ()
{
	this.Mesh.position.set(Math.random() * 400 - 200, Math.random() * 400 - 200, Math.random() * 400 - 200);				
};

// это функция, которая должна вызываться в главной игровой функции
_QBorgGamePlayerShip.prototype.Life = function ()
{
	this.BBox.update();
	
	this.statusControl();
	
	this.PlasmaGun.update();
};

/*Контролирует изменение статуса игрока.
 *СТАТУС = {"live", "dead"};
 */
_QBorgGamePlayerShip.prototype.statusControl = function ()
{
	this.healthAndDeadControl();
};

_QBorgGamePlayerShip.prototype.healthAndDeadControl = function()
{
	if(this.Health <= 0)
	{
		this.Status = "dead";
	}
};
/*IN:
 * json_params = {
 * 	damage: damage
 * }
 */

_QBorgGamePlayerShip.prototype.onDamaged = function (json_params) 
{
	if(json_params !== undefined)
	{
		if(json_params.damage !== undefined)
		{
			this.Health -= json_params.damage;
		}
	}
};
/* Устанавливает позицию корабля
 */ 
_QBorgGamePlayerShip.prototype.setPosition = function (json_params)
{
	if(typeof(json_params) === "string")
		json_params = JSON.parse(json_params);
	
//	this.Mesh.position.set();	
	this.Mesh.position.copy(json_params);
};
/* Устанавливает поворот корабля в пространстве
 */
_QBorgGamePlayerShip.prototype.setRotation = function (json_params)
{
	if(typeof(json_params) === "string")
		json_params = JSON.parse(json_params);
		
	this.Mesh.rotation.copy(json_params);
};
/* Стреляет в направлении, которое было указано в параметре,
 * снаряд летит с определенной скоростью
 * Принимает на вход:
 * {
 *  distance: json_params.parameters.distance,
 * 	speed: json_params.parameters.speed,
 * 	start_position: json_params.parameters.start_position,
 * 	direction: json_params.direction,
 *	gun_type: "gun_type",
 *  bullet_type: "bullet_type",
 *  remote_players: json_params.remote_players,
 *  all_players: json_params.all_players
 * }
 */
_QBorgGamePlayerShip.prototype.shoot = function (json_params)
{
	var gun = this.getGunByType(json_params);
	json_params.mesh = gun.getBulletMeshByBulletType(json_params);
	gun.shoot(json_params);
};

_QBorgGamePlayerShip.prototype.getGunByType = function (json_params)
{
	if(json_params.gun_type !== undefined)
	{
		if(json_params.gun_type === "plasma_gun")
		{
			return this.PlasmaGun;
		}
	}
};

/* Возвращает позицию корабля 
 */
_QBorgGamePlayerShip.prototype.getPosition = function ()
{
	return this.Mesh.position.clone();
};
/* Возвращает поворот корабля
 */
_QBorgGamePlayerShip.prototype.getRotation = function ()
{
	return this.Mesh.rotation.clone();
};

_QBorgGamePlayerShip.prototype.getMesh = function ()
{
	return this.Mesh;
};

_QBorgGamePlayerShip.prototype.removeMesh = function ()
{
	this.Scene.remove(this.Mesh);
};
