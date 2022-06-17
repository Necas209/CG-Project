import * as THREE from 'three';
import {Octree} from 'three/examples/jsm/math/Octree';
import {CSG} from 'three-csg-ts';

class Ellipse extends THREE.Curve {
	constructor(xRadius, yRadius) {
		super();
		this.xRadius = xRadius;
		this.yRadius = yRadius;
	}

	getPoint(t, optionalTarget) {
		const radians = 2 * Math.PI * t;
		// noinspection JSValidateTypes
		return new THREE.Vector3(
			this.xRadius * Math.cos(radians),
			this.yRadius * Math.sin(radians),
			0
		);
	}
}

export class PicketFence extends THREE.Mesh {
	constructor() {
		const shape = new THREE.Shape();
		shape.lineTo(0.2, 0);
		shape.lineTo(0.2, 0.9);
		shape.lineTo(0.7, 0.9);
		shape.lineTo(0.7, 1.1);
		shape.lineTo(0.2, 1.1);
		shape.lineTo(0.2, 1.5);
		shape.lineTo(0.7, 1.5);
		shape.lineTo(0.7, 1.7);
		shape.lineTo(0.2, 1.7);
		shape.lineTo(0.2, 2);
		shape.lineTo(0.1, 2.25);
		shape.lineTo(0, 2);
		shape.lineTo(0, 1.7);
		shape.lineTo(-0.5, 1.7);
		shape.lineTo(-0.5, 1.5);
		shape.lineTo(0, 1.5);
		shape.lineTo(0, 1.1);
		shape.lineTo(-0.5, 1.1);
		shape.lineTo(-0.5, 0.9);
		shape.lineTo(0, 0.9);
		// Fence geometry and material
		const fenceGeometry = new THREE.ExtrudeGeometry(shape, {depth: 0});
		super(fenceGeometry, new WoodMaterial());
		super.castShadow = super.receiveShadow = true;
	}
}

export class PorchLight extends THREE.Group {
	constructor() {
		super();
		const textureLoader = new THREE.TextureLoader();
		const metalMaterial = new THREE.MeshStandardMaterial({
			map: textureLoader.load('textures/porch-lights/Metal021_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Metal021_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Metal021_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Metal021_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Metal021_1K_Roughness.png'),
			displacementScale: 0
		});
		// Base
		const baseGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.2);
		const baseMesh = new THREE.Mesh(baseGeometry, metalMaterial);
		super.add(baseMesh);
		// Sides
		const sideGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.02);
		const sidePos = [[-0.09, -0.09], [0.09, -0.09], [0.09, 0.09], [-0.09, 0.09]];
		sidePos.forEach((pos) => {
			const sideMesh = new THREE.Mesh(sideGeometry, metalMaterial);
			sideMesh.position.set(pos[0], 0.175, pos[1]);
			super.add(sideMesh);
		});
		// Glass Sides
		const glassGeometry = new THREE.BoxGeometry(0.01, 0.3, 0.16);
		const glassPos = [[-0.09, 0], [0, -0.09], [0.09, 0], [0, 0.09]];
		glassPos.forEach((pos, i) => {
			const glassMesh = new THREE.Mesh(glassGeometry, new GlassMaterial());
			glassMesh.position.set(pos[0], 0.175, pos[1]);
			glassMesh.rotateY(Math.PI / 2 * i);
			super.add(glassMesh);
		});
		// Top
		const topGeometry = new THREE.ConeGeometry(0.15, 0.1, 4);
		const topMesh = new THREE.Mesh(topGeometry, metalMaterial);
		topMesh.position.set(0, 0.375, 0);
		topMesh.rotateY(Math.PI / 4);
		super.add(topMesh);
		// Hook
		const hookGeometry = new THREE.BoxGeometry(0.2, 0.015, 0.015);
		const hookMesh = new THREE.Mesh(hookGeometry, metalMaterial);
		hookMesh.position.set(0.08, 0.61, 0);
		super.add(hookMesh);
		// Hook Base
		const hookBaseGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.1);
		const hookBaseMesh = new THREE.Mesh(hookBaseGeometry, metalMaterial);
		hookBaseMesh.position.set(0.19, 0.61, 0);
		super.add(hookBaseMesh);
		// Chain
		const ringPath = new Ellipse(0.015, 0.03);
		const ringGeometry = new THREE.TubeGeometry(ringPath, 64, 0.005, 16, true);
		const chain = new THREE.Group();
		for (let i = 0; i < 4; i++) {
			const ringMesh = new THREE.Mesh(ringGeometry, metalMaterial);
			ringMesh.rotateY(Math.PI / 2 * i);
			ringMesh.position.set(0, i * 0.05, 0);
			chain.add(ringMesh);
		}
		chain.position.set(0, 0.435, 0);
		chain.traverse((child) => {
			child.castShadow = child.receiveShadow = true;
		});
		super.add(chain);
		// Candle
		const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
		const candleMaterial = new THREE.MeshStandardMaterial({color: 0xfffff0});
		const candleMesh = new THREE.Mesh(candleGeometry, candleMaterial);
		candleMesh.position.set(0, 0.125, 0);
		super.add(candleMesh);
		// Flame
		const candleLight = new THREE.PointLight(0xfbb741, 1, 100, 2);
		candleLight.power = 20;
		const flameGeometry = new THREE.ConeGeometry(0.02, 0.06);
		const flameMaterial = new THREE.MeshStandardMaterial({
			emissive: 0xfbb741, emissiveIntensity: 2, color: 0x000000
		});
		candleLight.add(new THREE.Mesh(flameGeometry, flameMaterial));
		candleLight.position.set(0, 0.25, 0);
		super.add(candleLight);
		super.rotateY(Math.PI / 2);
		// Assure porch light casts and receives shadows
		super.traverse(child => {
			child.castShadow = child.receiveShadow = true;
		});
	}
}

export class Flashlight extends THREE.SpotLight {
	constructor() {
		super(0xffffff, 0);
		this.power = 0; // Default: Off
		this.angle = Math.PI / 5;
		this.decay = 2;
	}

	turn_on_off() {
		this.power = (this.power > 0) ? 0 : 20;
	}
}

export class NPC extends THREE.Group {
	constructor() {
		super();
		const material = new THREE.MeshBasicMaterial({
			color: 'white'
		});
		const edgesMaterial = new THREE.LineBasicMaterial({
			color: 0x3B3C36,
			linewidth: 2
		});
		const torsoGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6);
		const torsoMesh = new THREE.Mesh(torsoGeometry, material);
		let geometry = new THREE.EdgesGeometry(torsoMesh.geometry);
		let edges = new THREE.LineSegments(geometry, edgesMaterial);
		torsoMesh.add(edges);
		this.add(torsoMesh);
		const headGeometry = new THREE.SphereGeometry(0.15);
		const headMesh = new THREE.Mesh(headGeometry, material);
		// geometry = new THREE.EdgesGeometry(headMesh.geometry);
		// edges = new THREE.LineSegments(geometry, edgesMaterial);
		// headMesh.add(edges);
		headMesh.position.setY(0.45);
		this.add(headMesh);
		const armGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.7);
		const armMesh = new THREE.Mesh(armGeometry, material);
		geometry = new THREE.EdgesGeometry(armMesh.geometry);
		edges = new THREE.LineSegments(geometry, edgesMaterial);
		armMesh.add(edges);
		const leftArmMesh = armMesh.clone();
		leftArmMesh.rotateZ(-Math.PI / 7);
		leftArmMesh.position.set(-0.2, -0.05, 0);
		this.add(leftArmMesh);
		const rightArmMesh = armMesh.clone();
		rightArmMesh.rotateZ(Math.PI / 7);
		rightArmMesh.position.set(0.2, -0.05, 0);
		rightArmMesh.add(edges);
		this.add(rightArmMesh);
		const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.7);
		const legMesh = new THREE.Mesh(legGeometry, material);
		geometry = new THREE.EdgesGeometry(legMesh.geometry);
		edges = new THREE.LineSegments(geometry, edgesMaterial);
		legMesh.add(edges);
		const leftLegMesh = legMesh.clone();
		leftLegMesh.rotateZ(-Math.PI / 9);
		leftLegMesh.position.set(-0.15, -0.6, 0);
		this.add(leftLegMesh);
		const rightLegMesh = legMesh.clone();
		rightLegMesh.rotateZ(Math.PI / 9);
		rightLegMesh.position.set(0.15, -0.6, 0);
		this.add(rightLegMesh);
	}
}

class WoodMaterial extends THREE.MeshStandardMaterial {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		const colorMap = textureLoader.load('textures/fence/Wood033_1K_Color.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(0.6, 0.6);
		});
		const normalMap = textureLoader.load('textures/fence/Wood033_1K_NormalGL.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(0.6, 0.6);
		});
		super({
			map: colorMap,
			aoMap: textureLoader.load('textures/fence/Wood033_1K_AmbientOcclusion.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/fence/Wood033_1K_Roughness.png'),
			displacementMap: textureLoader.load('textures/fence/Wood033_1K_Displacement.png'),
			displacementScale: 0
		});
	}
}

class WallMaterial extends THREE.MeshStandardMaterial {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load('textures/wall/WoodSiding001_1K_Color.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		const normalMap = textureLoader.load('textures/wall/WoodSiding001_1K_NormalGL.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		super({
			map: map,
			aoMap: textureLoader.load('textures/wall/WoodSiding001_1K_AmbientOcclusion.png'),
			displacementMap: textureLoader.load('textures/wall/WoodSiding001_1K_Displacement.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/wall/WoodSiding001_1K_Roughness.png'),
			displacementScale: 0
		});
	}
}

class GlassMaterial extends THREE.MeshPhysicalMaterial {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		super({
			map: textureLoader.load('textures/porch-lights/Facade001_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Facade001_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Facade001_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Facade001_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Facade001_1K_Roughness.png'),
			displacementScale: 0,
			transmission: 1,
			opacity: 0.8,
			transparent: true
		});
	}
}

function updateWorldOctree(needsUpdate = false) {
	if (needsUpdate) {
		House.doorsOctree = new Octree();
		for (let door in House.doors) {
			House.doorsOctree.fromGraphNode(House.doors[door]);
		}
	}
}

export class House {
	static switches = {};
	static doors = {};
	static doorsOctree = new Octree();

	static animate_doors(deltaTime) {
		for (let door in House.doors) {
			House.doors[door].animate_door(deltaTime);
		}
	}

	static check_interactions(intersects) {
		if (intersects[0].distance < 5) {
			let name = intersects[0].object.parent.name;
			if (name.includes('door')) {
				House.doors[name].check_door();
			} else {
				name = intersects[0].object.parent.parent?.name;
				if (name?.includes('switch')) {
					House.switches[name].turn_on_off();
				}
			}
		}
	}

	static add_ceiling_lights(scene) {
		// Hall light
		const hallLight = new CeilingLight();
		hallLight.position.set(2.5, 3.3, -2);
		scene.add(hallLight);
		const hallSwitch = new LightSwitch('hall_switch', hallLight);
		hallSwitch.rotateZ(-Math.PI / 2);
		hallSwitch.position.set(1.22, 2, -1);
		scene.add(hallSwitch);
		House.switches['hall_switch'] = hallSwitch;
		// Living room light
		const livingLight = new CeilingLight();
		livingLight.position.set(-1.5, 3.3, -2);
		scene.add(livingLight);
		const livingSwitch = new LightSwitch('living_switch', livingLight);
		livingSwitch.rotateZ(Math.PI / 2);
		livingSwitch.position.set(0.78, 2, -1);
		scene.add(livingSwitch);
		House.switches['living_switch'] = livingSwitch;
		// Bedroom light
		const bedroomLight = new CeilingLight();
		bedroomLight.position.set(-1.5, 3.3, 2);
		scene.add(bedroomLight);
		const bedroomSwitch = new LightSwitch('bedroom_switch', bedroomLight);
		bedroomSwitch.position.set(0.4, 2, 0.22);
		scene.add(bedroomSwitch);
		House.switches['bedroom_switch'] = bedroomSwitch;
	}

	static add_doors(scene) {
		// Front door
		const frontDoor = new Door('front_door');
		frontDoor.castShadow = frontDoor.receiveShadow = true;
		frontDoor.position.set(3.1, 1.65, 0);
		House.doors['front_door'] = frontDoor;
		scene.add(frontDoor);
		// Living room door
		const livingDoor = new Door('living_door');
		livingDoor.castShadow = frontDoor.castShadow = true;
		livingDoor.rotateY(Math.PI / 2);
		livingDoor.position.set(1, 1.65, -2.6);
		House.doors['living_door'] = livingDoor;
		scene.add(livingDoor);
		// Bedroom door
		const bedroomDoor = new Door('bedroom_door');
		bedroomDoor.castShadow = bedroomDoor.receiveShadow = true;
		bedroomDoor.rotation.y = Math.PI;
		bedroomDoor.position.set(-1.1, 1.65, 0);
		House.doors['bedroom_door'] = bedroomDoor;
		scene.add(bedroomDoor);
		for (let door in House.doors) {
			House.doorsOctree.fromGraphNode(House.doors[door]);
		}
	}

	static add_floor(scene) {
		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load('textures/floor/Wood062_1K_Color.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		const normalMap = textureLoader.load('textures/floor/Wood062_1K_NormalGL.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		const material = new THREE.MeshStandardMaterial({
			map: map,
			aoMap: textureLoader.load('textures/floor/Wood062_1K_AmbientOcclusion.png'),
			displacementMap: textureLoader.load('textures/floor/Wood062_1K_Displacement.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/floor/Wood062_1K_Roughness.png'),
			displacementScale: 0
		});
		const shape = new THREE.Shape();
		shape.lineTo(5, 0);
		shape.lineTo(5, 4);
		shape.lineTo(8, 4);
		shape.lineTo(8, 8);
		shape.lineTo(0, 8);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.0001});
		const floor = new THREE.Mesh(geometry, material);
		floor.castShadow = floor.receiveShadow = true;
		floor.rotateX(-Math.PI / 2);
		floor.position.set(-4, 0.3, 4);
		scene.add(floor);
	}

	static add_ceiling(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(8, 0);
		shape.lineTo(8, 8);
		shape.lineTo(0, 8);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.0001});
		const ceiling = new THREE.Mesh(geometry, new WallMaterial());
		ceiling.castShadow = ceiling.receiveShadow = true;
		ceiling.rotateX(-Math.PI / 2);
		ceiling.position.set(-4, 3.7, 4);
		scene.add(ceiling);
	}

	static add_roof(scene) {
		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load('textures/roof/RoofingTiles009_1K_Color.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(8, 5);
		});
		const normalMap = textureLoader.load('textures/roof/RoofingTiles009_1K_NormalGL.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(8, 5);
		});
		const material = new THREE.MeshStandardMaterial({
			map: map,
			displacementMap: textureLoader.load('textures/roof/RoofingTiles009_1K_Displacement.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/roof/RoofingTiles009_1K_Roughness.png'),
			displacementScale: 0
		});
		const geometry = new THREE.ConeGeometry(4 * Math.sqrt(2), 3, 4);
		const roof = new THREE.Mesh(geometry, material);
		roof.castShadow = roof.receiveShadow = true;
		roof.rotateY(Math.PI / 4);
		roof.position.setY(5.4);
		scene.add(roof);
	}

	static add_left_wall(scene) {
		const wallShape = new THREE.Shape();
		wallShape.lineTo(8, 0);
		wallShape.lineTo(8, 3);
		wallShape.lineTo(0, 3);
		const leftWindowPath = new THREE.Path();
		leftWindowPath.moveTo(1, 1);
		leftWindowPath.lineTo(2.5, 1);
		leftWindowPath.lineTo(2.5, 2);
		leftWindowPath.lineTo(1, 2);
		wallShape.holes.push(leftWindowPath);
		const rightWindowPath = new THREE.Path();
		rightWindowPath.moveTo(5.5, 1);
		rightWindowPath.lineTo(7, 1);
		rightWindowPath.lineTo(7, 2);
		rightWindowPath.lineTo(5.5, 2);
		wallShape.holes.push(rightWindowPath);
		const wallGeometry = new THREE.ExtrudeGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WallMaterial());
		wallMesh.castShadow = wallMesh.receiveShadow = true;
		wallMesh.rotateY(Math.PI / 2);
		wallMesh.position.set(-4, 0.5, 4);
		scene.add(wallMesh);
		const leftWindow = new Window();
		leftWindow.castShadow = leftWindow.receiveShadow = true;
		leftWindow.rotateY(Math.PI / 2);
		leftWindow.position.set(-4, 2, -2.25);
		scene.add(leftWindow);
		const rightWindow = new Window();
		rightWindow.castShadow = rightWindow.receiveShadow = true;
		rightWindow.position.set(-4, 2, 2.25);
		rightWindow.rotateY(Math.PI / 2);
		scene.add(rightWindow);
	}

	static add_right_wall(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(4, 0);
		shape.lineTo(4, 3);
		shape.lineTo(0, 3);
		const windowPath = new THREE.Path();
		windowPath.moveTo(1.5, 1);
		windowPath.lineTo(3, 1);
		windowPath.lineTo(3, 2);
		windowPath.lineTo(1.5, 2);
		shape.holes.push(windowPath);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const wall = new THREE.Mesh(geometry, new WallMaterial());
		wall.castShadow = wall.receiveShadow = true;
		wall.rotateY(Math.PI / 2);
		wall.position.set(4, 0.5, 0);
		scene.add(wall);
		const window = new Window();
		window.castShadow = window.receiveShadow = true;
		window.rotateY(Math.PI / 2);
		window.position.set(4, 2, -2.25);
		scene.add(window);
	}

	static add_right_front_wall(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(3, 0);
		shape.lineTo(3, 3);
		shape.lineTo(0, 3);
		const doorPath = new THREE.Path();
		doorPath.moveTo(0.9, 0);
		doorPath.lineTo(2.1, 0);
		doorPath.lineTo(2.1, 2.3);
		doorPath.lineTo(0.9, 2.3);
		shape.holes.push(doorPath);
		const wallGeometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const wall = new THREE.Mesh(wallGeometry, new WallMaterial());
		wall.castShadow = wall.receiveShadow = true;
		wall.position.set(1, 0.5, 0);
		scene.add(wall);
	}

	static add_right_left_wall(scene) {
		const wallShape = new THREE.Shape();
		wallShape.moveTo(0, 0);
		wallShape.lineTo(4, 0);
		wallShape.lineTo(4, 3);
		wallShape.lineTo(0, 3);
		wallShape.moveTo(0, 0);
		const wallGeometry = new THREE.ExtrudeGeometry(wallShape, {depth: 0.01});
		const wall = new THREE.Mesh(wallGeometry, new WallMaterial());
		wall.castShadow = wall.receiveShadow = true;
		wall.rotateY(Math.PI / 2);
		wall.position.set(1, 0.5, 4);
		scene.add(wall);
	}

	static add_front_wall(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(5, 0);
		shape.lineTo(5, 3);
		shape.lineTo(0, 3);
		const path = new THREE.Path();
		path.moveTo(1.75, 1);
		path.lineTo(3.25, 1);
		path.lineTo(3.25, 2);
		path.lineTo(1.75, 2);
		shape.holes.push(path);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(geometry, new WallMaterial());
		wallMesh.castShadow = wallMesh.receiveShadow = true;
		wallMesh.position.set(-4, 0.5, 4);
		scene.add(wallMesh);
		const window = new Window();
		window.castShadow = window.receiveShadow = true;
		window.position.set(-1.5, 2, 4);
		scene.add(window);
		const doorStepShape = new THREE.Shape();
		doorStepShape.lineTo(0.8, 0);
		doorStepShape.lineTo(0, 0.04);
		const doorStepGeometry = new THREE.ExtrudeGeometry(doorStepShape, {depth: 0.5});
		const doorstep = new THREE.Mesh(doorStepGeometry, new WallMaterial());
		doorstep.castShadow = doorstep.receiveShadow = true;
		doorstep.rotateY(-Math.PI / 2);
		doorstep.position.set(2.75, 0.4, 0.2);
		scene.add(doorstep);
	}

	static add_back_wall(scene) {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(8, 0);
		shape.lineTo(8, 3);
		shape.lineTo(0, 3);
		shape.lineTo(0, 0);
		const leftWindowPath = new THREE.Path();
		leftWindowPath.moveTo(1.75, 1);
		leftWindowPath.lineTo(3.25, 1);
		leftWindowPath.lineTo(3.25, 2);
		leftWindowPath.lineTo(1.75, 2);
		shape.holes.push(leftWindowPath);
		const rightWindowPath = new THREE.Path();
		rightWindowPath.moveTo(6, 1);
		rightWindowPath.lineTo(7, 1);
		rightWindowPath.lineTo(7, 2);
		rightWindowPath.lineTo(6, 2);
		shape.holes.push(rightWindowPath);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const wall = new THREE.Mesh(geometry, new WallMaterial());
		wall.castShadow = wall.receiveShadow = true;
		wall.position.set(-4, 0.5, -4);
		scene.add(wall);
		const leftWindow = new Window();
		leftWindow.castShadow = leftWindow.receiveShadow = true;
		leftWindow.position.set(-1.5, 2, -4);
		scene.add(leftWindow);
		const rightWindow = new Window(1, 1);
		rightWindow.castShadow = rightWindow.receiveShadow = true;
		rightWindow.position.set(2.5, 2, -4);
		scene.add(rightWindow);
	}

	static add_inner_left_wall(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(5, 0);
		shape.lineTo(5, 3);
		shape.lineTo(0, 3);
		const path = new THREE.Path();
		path.moveTo(2.9, 0);
		path.lineTo(4.1, 0);
		path.lineTo(4.1, 2.3);
		path.lineTo(2.9, 2.3);
		shape.holes.push(path);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const wall = new THREE.Mesh(geometry, new WallMaterial());
		wall.castShadow = wall.receiveShadow = true;
		wall.position.set(-4, 0.5, 0);
		scene.add(wall);
	}

	static add_inner_right_wall(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(4, 0);
		shape.lineTo(4, 3);
		shape.lineTo(0, 3);
		const path = new THREE.Path();
		path.moveTo(1.4, 0);
		path.lineTo(2.6, 0);
		path.lineTo(2.6, 2.3);
		path.lineTo(1.4, 2.3);
		shape.holes.push(path);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const wall = new THREE.Mesh(geometry, new WallMaterial());
		wall.castShadow = wall.receiveShadow = true;
		wall.rotateY(Math.PI / 2);
		wall.position.set(1, 0.5, 0);
		scene.add(wall);
	}

	static add_pillar(scene) {
		const shape = new THREE.Shape();
		shape.lineTo(0.4, 0);
		shape.lineTo(0.4, 3);
		shape.lineTo(0, 3);
		const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.01});
		const pillar = new THREE.Mesh(geometry, new WallMaterial());
		pillar.castShadow = pillar.receiveShadow = true;
		pillar.rotateY(Math.PI / 2);
		pillar.position.set(3.8, 0.5, 4);
		scene.add(pillar);
	}
}

class LightSwitch extends THREE.Group {
	constructor(name, ceilingLight) {
		super();
		this.name = name;
		this.ceilingLight = ceilingLight;
		const switchMaterial = new THREE.MeshStandardMaterial({color: 'white'});
		const borderGeometry = new THREE.CylinderGeometry(0.09, 0.1, 0.01, 4);
		const borderMesh = new THREE.Mesh(borderGeometry, switchMaterial);
		borderMesh.rotateY(Math.PI / 4);
		// Add edges
		let geometry = new THREE.EdgesGeometry(borderMesh.geometry);
		let material = new THREE.LineBasicMaterial({color: 0x3B3C36, linewidth: 2});
		let edges = new THREE.LineSegments(geometry, material);
		borderMesh.add(edges);
		this.add(borderMesh);
		const switchGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.05);
		const switchMesh = new THREE.Mesh(switchGeometry, switchMaterial);
		switchMesh.rotateX(-Math.PI / 4);
		// Add edges
		geometry = new THREE.EdgesGeometry(switchMesh.geometry);
		material = new THREE.LineBasicMaterial({color: 0x3B3C36, linewidth: 2});
		edges = new THREE.LineSegments(geometry, material);
		switchMesh.add(edges);
		this.switch = switchMesh;
		this.add(switchMesh);
		this.rotateX(Math.PI / 2);
	}

	turn_on_off() {
		if (this.rotation.x >= -Math.PI / 4)
			this.switch.rotateX(Math.PI / 2);
		else
			this.switch.rotateX(-Math.PI / 2);
		this.ceilingLight.on_off_light();
	}
}

class CeilingLight extends THREE.Group {
	constructor() {
		super();
		const outerLampGeometry = new THREE.CylinderGeometry(0.06, 0.16, 0.2);
		const innerLampGeometry = new THREE.CylinderGeometry(0.05, 0.15, 0.2);
		const lampMaterial = new THREE.MeshPhysicalMaterial({
			color: 'white', transmission: 0.2
		});
		const outerLampMesh = new THREE.Mesh(outerLampGeometry, lampMaterial);
		const innerLampMesh = new THREE.Mesh(innerLampGeometry, lampMaterial);
		const lampMesh = CSG.subtract(outerLampMesh, innerLampMesh);
		this.add(lampMesh);
		// Flame
		const light = new THREE.PointLight(0xfad16b, 1, 100, 2);
		light.power = 0;
		const bulbGeometry = new THREE.SphereGeometry(0.05);
		const bulbMaterial = new THREE.MeshStandardMaterial({
			emissive: 0xfad16b, emissiveIntensity: 2, color: 0x000000
		});
		light.add(new THREE.Mesh(bulbGeometry, bulbMaterial));
		light.position.set(0, -0.02, 0);
		this.light = light;
		super.add(light);
	}

	on_off_light() {
		this.light.power = this.light.power === 0 ? 150 : 0;
	}
}

class Window extends THREE.Group {
	constructor(width = 1.5, height = 1) {
		super();
		const thickness = 0.2;
		const vertMesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, 0.1), new WallMaterial());
		super.add(vertMesh);
		const dimensions = [-(width + thickness) / 4, (width + thickness) / 4];
		dimensions.forEach(x => {
			const horizMesh = new THREE.Mesh(
				new THREE.BoxGeometry((width - thickness) / 2, thickness, 0.1),
				new WallMaterial()
			);
			horizMesh.position.setX(x);
			super.add(horizMesh);
		});
		const glassGeometry = new THREE.BoxGeometry(
			(width - thickness) / 2,
			(height - thickness) / 2,
			0.1
		);
		const glassPos = [
			[0, 0],
			[(width + thickness) / 2, 0],
			[(width + thickness) / 2, (height + thickness) / 2],
			[0, (height + thickness) / 2]
		];
		glassPos.forEach(xy => {
			const glassMesh = new THREE.Mesh(glassGeometry, new GlassMaterial());
			glassMesh.position.set(xy[0] - (width + thickness) / 4, xy[1] - (height + thickness) / 4, 0);
			super.add(glassMesh);
		});
	}
}

class Door extends THREE.Object3D {
	constructor(name) {
		super(); // Pivot
		this.name = name;
		this.isOpening = false;
		this.isClosing = false;
		const geometry = new THREE.BoxGeometry(1, 2.1, 0.1);
		const door = new THREE.Mesh(geometry, new WoodMaterial());
		const geometry2 = new THREE.SphereGeometry(0.05);
		const handle = new THREE.Mesh(geometry2, new WallMaterial());
		handle.position.set(-0.4, 0.1, 0.1);
		door.add(handle);
		const handle2 = handle.clone();
		handle2.position.set(-0.4, 0.1, -0.1);
		door.add(handle2);
		door.position.setX(-0.6);
		this.add(door);
	}

	check_door() {
		let rot_y = this.rotation.y;
		if (this.name === 'living_door') rot_y -= Math.PI / 2;
		if (this.name === 'bedroom_door') rot_y -= Math.PI;
		if (rot_y >= -Math.PI / 2) {
			this.isOpening = true;
			this.isClosing = false;
		}
		if (rot_y <= 0) {
			this.isOpening = false;
			this.isClosing = true;
		}
	}

	animate_door(deltaTime) {
		let rot_y = this.rotation.y;
		if (this.name === 'living_door') rot_y -= Math.PI / 2;
		if (this.name === 'bedroom_door') rot_y -= Math.PI;
		if (rot_y < -Math.PI / 2) {
			updateWorldOctree(this.isOpening);
			this.isOpening = false;
		}
		if (rot_y > 0) {
			updateWorldOctree(this.isClosing);
			this.isClosing = false;
		}
		if (this.isOpening) {
			this.rotation.y -= Math.PI / 3 * deltaTime;
		}
		if (this.isClosing) {
			this.rotation.y += Math.PI / 3 * deltaTime;
		}
	}
}