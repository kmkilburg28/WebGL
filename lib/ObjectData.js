class ObjectData {
	
	/**
	 * @type {THREE.Vector3}
	 */
	position;
	
	/**
	 * @type {number}
	 */
	typeId;
	
	/**
	 * @param {THREE.Vector3} position 
	 * @param {number} typeId 
	 */
	constructor(position, typeId) {
		this.position = position;
		this.typeId = typeId;
	}
}