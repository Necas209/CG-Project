import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

export const Wood = new THREE.MeshStandardMaterial({
    map: textureLoader.load('assets/textures/fence/Wood033_1K_Color.png', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.6, 0.6);
    }),
    aoMap: textureLoader.load('assets/textures/fence/Wood033_1K_AmbientOcclusion.png'),
    normalMap: textureLoader.load('assets/textures/fence/Wood033_1K_NormalGL.png', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.6, 0.6);
    }),
    roughnessMap: textureLoader.load('assets/textures/fence/Wood033_1K_Roughness.png'),
    displacementMap: textureLoader.load('assets/textures/fence/Wood033_1K_Displacement.png'),
    displacementScale: 0
});

export const Wall = new THREE.MeshStandardMaterial({
    map: textureLoader.load('assets/textures/wall/WoodSiding001_1K_Color.png', (texture) => {
        texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
    }),
    aoMap: textureLoader.load('assets/textures/wall/WoodSiding001_1K_AmbientOcclusion.png'),
    displacementMap: textureLoader.load('assets/textures/wall/WoodSiding001_1K_Displacement.png'),
    normalMap: textureLoader.load('assets/textures/wall/WoodSiding001_1K_NormalGL.png', (texture) => {
        texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
    }),
    roughnessMap: textureLoader.load('assets/textures/wall/WoodSiding001_1K_Roughness.png'),
    displacementScale: 0
});

export const Glass = new THREE.MeshPhysicalMaterial({
    map: textureLoader.load('assets/textures/porch-lights/Facade001_1K_Color.png'),
    displacementMap: textureLoader.load('assets/textures/porch-lights/Facade001_1K_Displacement.png'),
    metalnessMap: textureLoader.load('assets/textures/porch-lights/Facade001_1K_Metalness.png'),
    normalMap: textureLoader.load('assets/textures/porch-lights/Facade001_1K_NormalGL.png'),
    roughnessMap: textureLoader.load('assets/textures/porch-lights/Facade001_1K_Roughness.png'),
    displacementScale: 0,
    transmission: 1,
    opacity: 0.8,
    transparent: true
});

export const Metal = new THREE.MeshStandardMaterial({
    map: textureLoader.load('assets/textures/porch-lights/Metal021_1K_Color.png'),
    displacementMap: textureLoader.load('assets/textures/porch-lights/Metal021_1K_Displacement.png'),
    metalnessMap: textureLoader.load('assets/textures/porch-lights/Metal021_1K_Metalness.png'),
    normalMap: textureLoader.load('assets/textures/porch-lights/Metal021_1K_NormalGL.png'),
    roughnessMap: textureLoader.load('assets/textures/porch-lights/Metal021_1K_Roughness.png'),
    displacementScale: 0
});