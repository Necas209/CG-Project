import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import * as materials from './materials';

export interface Interactable extends THREE.Object3D {
    interact(): void;
}

/** @class
 * @classdesc An extension of THREE.Curve to draw an ellipse
 * @extends THREE.Curve
 */
class Ellipse extends THREE.Curve<THREE.Vector3> {
    xRadius: number;
    yRadius: number;
    constructor(xRadius: number, yRadius: number) {
        super();
        this.xRadius = xRadius;
        this.yRadius = yRadius;
    }

    getPoint(t: number, _optionalTarget?: THREE.Vector3 | undefined): THREE.Vector3 {
        const radians = 2 * Math.PI * t;
        return new THREE.Vector3(
            this.xRadius * Math.cos(radians),
            this.yRadius * Math.sin(radians),
            0
        );
    }
}

/** @class
 * @classdesc A class to represent a picket fence
 * @extends THREE.Mesh
 */
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
        const fenceGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0 });
        super(fenceGeometry, materials.Wood);
        this.castShadow = this.receiveShadow = true;
    }
}

/** @class
 * @classdesc A class to represent a porch light
 * @extends THREE.Group
 */
export class PorchLight extends THREE.Group {
    constructor() {
        super();
        // Base
        const baseGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.2);
        const baseMesh = new THREE.Mesh(baseGeometry, materials.Metal);
        super.add(baseMesh);
        // Sides
        const sideGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.02);
        const sidePos = [[-0.09, -0.09], [0.09, -0.09], [0.09, 0.09], [-0.09, 0.09]];
        sidePos.forEach((pos) => {
            const sideMesh = new THREE.Mesh(sideGeometry, materials.Metal);
            sideMesh.position.set(pos[0], 0.175, pos[1]);
            super.add(sideMesh);
        });
        // Materials.Glass Sides
        const glassGeometry = new THREE.BoxGeometry(0.01, 0.3, 0.16);
        const glassPos = [[-0.09, 0], [0, -0.09], [0.09, 0], [0, 0.09]];
        glassPos.forEach((pos, i) => {
            const glassMesh = new THREE.Mesh(glassGeometry, materials.Glass);
            glassMesh.position.set(pos[0], 0.175, pos[1]);
            glassMesh.rotateY(Math.PI / 2 * i);
            super.add(glassMesh);
        });
        // Top
        const topGeometry = new THREE.ConeGeometry(0.15, 0.1, 4);
        const topMesh = new THREE.Mesh(topGeometry, materials.Metal);
        topMesh.position.set(0, 0.375, 0);
        topMesh.rotateY(Math.PI / 4);
        super.add(topMesh);
        // Hook
        const hookGeometry = new THREE.BoxGeometry(0.2, 0.015, 0.015);
        const hookMesh = new THREE.Mesh(hookGeometry, materials.Metal);
        hookMesh.position.set(0.08, 0.61, 0);
        super.add(hookMesh);
        // Hook Base
        const hookBaseGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.1);
        const hookBaseMesh = new THREE.Mesh(hookBaseGeometry, materials.Metal);
        hookBaseMesh.position.set(0.19, 0.61, 0);
        super.add(hookBaseMesh);
        // Chain
        const ringPath = new Ellipse(0.015, 0.03);
        const ringGeometry = new THREE.TubeGeometry(ringPath, 64, 0.005, 16, true);
        const chain = new THREE.Group();
        for (let i = 0; i < 4; i++) {
            const ringMesh = new THREE.Mesh(ringGeometry, materials.Metal);
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
        const candleMaterial = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
        const candleMesh = new THREE.Mesh(candleGeometry, candleMaterial);
        candleMesh.position.set(0, 0.125, 0);
        super.add(candleMesh);
        // Flame
        const candleLight = new THREE.PointLight(0xfbb741, 1, 100, 2);
        candleLight.power = 10;
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

/** @class
 * @classdesc A class to represent a flashlight
 * @extends THREE.SpotLight
 */
export class Flashlight extends THREE.SpotLight {
    constructor() {
        super(0xffffff, 0);
        this.power = 0; // Default: Off
        this.angle = Math.PI / 5;
        this.decay = 2;
    }

    turn_on_off() {
        this.power = this.power > 0 ? 0 : 20;
    }
}

/** @class
 * @classdesc A class to represent an NPC
 * @extends THREE.Group
 */
export class NPC extends THREE.Group {
    constructor() {
        super();
        const material = new THREE.MeshBasicMaterial({ color: 'white' });
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

/** @class
 * @classdesc A class to represent a light switch
 * @extends THREE.Group
 */
export class LightSwitch extends THREE.Group implements Interactable {
    ceilingLight: CeilingLight;
    switch: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>;
    constructor(name: string, ceilingLight: CeilingLight) {
        super();
        this.name = name;
        this.ceilingLight = ceilingLight;
        const switchMaterial = new THREE.MeshStandardMaterial({ color: 'white' });
        const borderGeometry = new THREE.CylinderGeometry(0.09, 0.1, 0.01, 4);
        const borderMesh = new THREE.Mesh(borderGeometry, switchMaterial);
        borderMesh.rotateY(Math.PI / 4);
        // Add edges
        const geometry = new THREE.EdgesGeometry(borderMesh.geometry);
        let material = new THREE.LineBasicMaterial({ color: 0x3B3C36, linewidth: 2 });
        let edges = new THREE.LineSegments(geometry, material);
        borderMesh.add(edges);
        this.add(borderMesh);
        const switchGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.05);
        const switchMesh = new THREE.Mesh(switchGeometry, switchMaterial);
        switchMesh.rotateX(-Math.PI / 4);
        // Add edges
        const edges2 = new THREE.LineSegments(
            new THREE.EdgesGeometry(switchMesh.geometry),
            new THREE.LineBasicMaterial({ color: 0x3B3C36, linewidth: 2 })
        );
        switchMesh.add(edges2);
        this.switch = switchMesh;
        this.add(switchMesh);
        this.rotateX(Math.PI / 2);
    }

    interact() {
        if (this.rotation.x >= -Math.PI / 4)
            this.switch.rotateX(Math.PI / 2);
        else
            this.switch.rotateX(-Math.PI / 2);
        this.ceilingLight.on_off_light();
    }
}

/** @class
 * @classdesc A class to represent a ceiling light
 * @extends THREE.Group
 */
export class CeilingLight extends THREE.Group {
    light: THREE.PointLight;
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

/** @class
 * @classdesc A class to represent a window
 * @extends THREE.Group
 */
export class GlassWindow extends THREE.Group {
    constructor(width: number = 1.5, height: number = 1) {
        super();
        const thickness = 0.2;
        const vertMesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, 0.1), materials.Wall);
        super.add(vertMesh);
        const dimensions = [-(width + thickness) / 4, (width + thickness) / 4];
        dimensions.forEach(x => {
            const horizMesh = new THREE.Mesh(
                new THREE.BoxGeometry((width - thickness) / 2, thickness, 0.1),
                materials.Wall
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
            const glassMesh = new THREE.Mesh(glassGeometry, materials.Glass);
            glassMesh.position.set(xy[0] - (width + thickness) / 4, xy[1] - (height + thickness) / 4, 0);
            super.add(glassMesh);
        });
    }
}

/** @class
 * @classdesc A class to represent a door
 * @extends THREE.Object3D
 */
export class Door extends THREE.Object3D implements Interactable {
    updateWorldOctree: (arg0: boolean) => void;
    isOpening: boolean;
    isClosing: boolean;
    constructor(name: string, updateWorldOctree: (arg0: boolean) => void) {
        super(); // Pivot
        this.name = name;
        this.updateWorldOctree = updateWorldOctree;
        this.isOpening = false;
        this.isClosing = false;
        const geometry = new THREE.BoxGeometry(1, 2.1, 0.1);
        const door = new THREE.Mesh(geometry, materials.Wood);
        const geometry2 = new THREE.SphereGeometry(0.05);
        const handle = new THREE.Mesh(geometry2, materials.Wall);
        handle.position.set(-0.4, 0.1, 0.1);
        door.add(handle);
        const handle2 = handle.clone();
        handle2.position.set(-0.4, 0.1, -0.1);
        door.add(handle2);
        door.position.setX(-0.6);
        this.add(door);
    }

    interact() {
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

    animate_door(deltaTime: number) {
        let rot_y = this.rotation.y;
        if (this.name === 'living_door') rot_y -= Math.PI / 2;
        if (this.name === 'bedroom_door') rot_y -= Math.PI;
        if (rot_y < -Math.PI / 2) {
            this.updateWorldOctree(this.isOpening);
            this.isOpening = false;
        }
        if (rot_y > 0) {
            this.updateWorldOctree(this.isClosing);
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