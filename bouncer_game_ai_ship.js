/*
 * Класс описывает куб, управляемый другим компьютером!
 * */

var _AICube = function (json_params)
{	
	this.Player = null;
	
	this.Geometry = new THREE.BoxBufferGeometry(200, 200, 200);
	this.Material = new THREE.MeshBasicMaterial({#dc1e35});
	this.Mesh = new THREE.Mesh(this.Geometry, this.Material);
	
	this.Status = "live";
	this.Health = 500;
	
	this.Scene = null;
	this.Targets = null;
	
	if(json_params !== undefined)
	{
		if(json_params.scene !== undefined)
		{
			this.Scene = json_params.scene;
			json_params.scene.add(this.Mesh);
		}
		if(json_params.player !== undefined)
		{
			this.Player = json_params.player;
		}
		if(json_params.targets !== undefined)
		{
			this.Targets = json_params.targets;
		}
	}
};
// это функция, которая должна вызываться в главной игровой функции
_AICube.prototype.Life = function ()
{
	if(this.Status !== "dead")
	{
		this.movingControl();
		this.attackControl();
	}
};

_AICube.prototype.attackControl() = function ()
{
	if(this.Target 
	if(this.Targets !== undefined && this.Targets !== null)
	{
		
	}
};

_AICube.prototype.movingControl = function ()
{
};

// эта функция вызывается, когда наносится урон игроку
_AICube.prototype.onAttackMe = function (json_params) 
{
	if(json_params !== undefined)
	{
		if(json_params.damage !== undefined)
		{
			this.Health -= json_params.damage;
		}
	}
};
