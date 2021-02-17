class ObjectType {
	
	/**
	 * @type {number}
	 */
	lightId;
	
	/**
	 * @type {number}
	 */
	geometryId;

	/**
	 * @type {number} 
	 */
	materialId;

	/**
	 * @type {boolean}
	 */
	shadowType

	/**
	 * @type {THREE.Light}
	 */
	light

	/**
	 * @param {number} typeId 
	 * @param {number} geometryId 
	 * @param {number} materialId 
	 * @param {boolean} shadowType 
	 * @param {THREE.Light|null} light 
	 */
	constructor(typeId, geometryId, materialId, shadowType, light) {
		this.typeId = typeId;
		this.geometryId = geometryId;
		this.materialId = materialId;
		this.shadowType = shadowType;
		this.light = light;
	}
}