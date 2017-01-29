/*Класс описывает пулю "плазматической пушки".
 * Выстрел представляет собой THREE.Mesh().
 * Имеет направление, скорость, дистанцию.
 * IN:
 * json_params = {
 * 	
 * }
 */

var _PlasmaBullet = function (json_params)
{	
	this.Distance = json_params.distance;
	this.Speed = json_params.speed;
	this.Direction = new THREE.Vector3().copy(json_params.direction);
	this.Mesh = json_params.mesh;
	this.Mesh.position.copy(json_params.start_position);
	this.AllPlayers = json_params.all_players;
	this.Damage = json_params.damage;
	this.OwnerID = json_params.owner_id;
	
	this.BBox = new THREE.BoundingBoxHelper(this.Mesh, 0x00ff00);
	
	this.Status = "live";		
	
	if(json_params.scene !== undefined){
		json_params.scene.add(this.Mesh);
		json_params.scene.add(this.BBox);
	}
};

_PlasmaBullet.prototype.addToScene = function (scene)
{
	scene.add(this.Mesh);
};

_PlasmaBullet.prototype.removeFromScene = function (scene)
{
	scene.remove(this.Mesh);
};

_PlasmaBullet.prototype.update = function ()
{
	this.BBox.update();
	this.collisionControl();
};

_PlasmaBullet.prototype.setStatus = function (status)
{
	if(status !== undefined)
		this.Status = status;
	else
		throw new Error("have no status");
};

_PlasmaBullet.prototype.getStatus = function ()
{
	return this.Status;
};
/*Отслеживает попадание в противников
 *В работе учитываем всех мешей: RemotePlayers.length + LocalPlayer
 */
_PlasmaBullet.prototype.collisionControl = function ()
{
	if(this.BBox.box.intersectsBox(this.AllPlayers[0].getShip().BBox.box))
	{
		if(this.AllPlayers[0].ID === this.OwnerID)
			return;
		this.AllPlayers[0].getShip().onDamaged({damage: this.Damage});
		this.setStatus("dead");
		return;
	}
	
	for(var i=0; i<this.AllPlayers[1].length; i++)
	{
		if(this.BBox.box.intersectsBox(this.AllPlayers[1][i].getShip().BBox.box))
		{
			if(this.AllPlayers[1][i].ID === this.OwnerID)
				return;

			this.AllPlayers[1][i].getShip().onDamaged({damage: this.Damage});
			this.setStatus("dead");
			return;
		}
	}
	
};
