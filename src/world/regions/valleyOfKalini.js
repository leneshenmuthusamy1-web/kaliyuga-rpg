// Region 1: The Valley of Kalini — tutorial region. Vikram's destroyed village.
// Builds low-poly Three.js geometry for the ruins/forge/temple and returns the
// interactables + encounter zones that WorldManager wires into gameplay.

export const REGION_ID = 'valley_of_kalini';

function ashMaterial(THREE, color, emissive) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.05, emissive: emissive || 0x000000, emissiveIntensity: 0.4 });
}

export function build({ THREE, scene }) {
  const obstacles = [];
  const interactables = [];
  const encounterZones = [];

  // --- Ground ---
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- Lighting: dusk, ash-choked sky ---
  scene.background = new THREE.Color(0x14121a);
  const hemi = new THREE.HemisphereLight(0x554433, 0x0a0a10, 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffab6b, 1.1);
  sun.position.set(-30, 40, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);

  // --- Burnt trees scattered around ---
  const trunkMat = ashMaterial(THREE, 0x1c1a18);
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 45;
    const x = Math.sin(angle) * dist;
    const z = Math.cos(angle) * dist;
    const h = 3 + Math.random() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, h, 5), trunkMat);
    trunk.position.set(x, h / 2, z);
    trunk.castShadow = true;
    scene.add(trunk);
    obstacles.push({ min: { x: x - 0.4, z: z - 0.4 }, max: { x: x + 0.4, z: z + 0.4 } });
  }

  // --- Ruined huts ---
  const hutMat = ashMaterial(THREE, 0x3a2f24);
  const hutPositions = [
    [-8, 6], [-14, -4], [10, -8],
  ];
  hutPositions.forEach(([x, z]) => {
    const hut = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 4), hutMat);
    hut.position.set(x, 1.1, z);
    hut.castShadow = true;
    hut.receiveShadow = true;
    scene.add(hut);
    obstacles.push({ min: { x: x - 2.1, z: z - 2.1 }, max: { x: x + 2.1, z: z + 2.1 } });
  });

  // --- The Forge (hidden cache) ---
  const forgePos = { x: 6, z: 4 };
  const forge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 3), ashMaterial(THREE, 0x2a2018, 0xff5a1e));
  forge.position.set(forgePos.x, 1, forgePos.z);
  forge.castShadow = true;
  scene.add(forge);
  const emberGlow = new THREE.PointLight(0xff6a2a, 1.2, 8);
  emberGlow.position.set(forgePos.x, 1.6, forgePos.z);
  scene.add(emberGlow);
  obstacles.push({ min: { x: forgePos.x - 1.7, z: forgePos.z - 1.6 }, max: { x: forgePos.x + 1.7, z: forgePos.z + 1.6 } });

  interactables.push({
    id: 'forge_cache',
    type: 'chest',
    position: forgePos,
    radius: 2.8,
    label: 'Search the forge',
    once: true,
    flag: 'forge_cache_opened',
  });

  // --- Temple (up the ash-slope, north) ---
  const templePos = { x: 0, z: -38 };
  const templeBase = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 1, 8), ashMaterial(THREE, 0x4a4136));
  templeBase.position.set(templePos.x, 0.5, templePos.z);
  templeBase.receiveShadow = true;
  scene.add(templeBase);
  const templeBody = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 6, 8), ashMaterial(THREE, 0x5a4f3f, 0x3a2f10));
  templeBody.position.set(templePos.x, 4, templePos.z);
  templeBody.castShadow = true;
  scene.add(templeBody);
  const templeGlow = new THREE.PointLight(0xf2c46d, 1.5, 14);
  templeGlow.position.set(templePos.x, 5, templePos.z);
  scene.add(templeGlow);
  obstacles.push({ min: { x: templePos.x - 6.5, z: templePos.z - 6.5 }, max: { x: templePos.x + 6.5, z: templePos.z + 6.5 } });

  interactables.push({
    id: 'temple_entry',
    type: 'transition',
    position: { x: templePos.x, z: templePos.z + 8 },
    radius: 3,
    label: 'Enter the temple',
    once: false,
  });

  // --- Ghost of Devimaa ---
  const ghostPos = { x: -3, z: 12 };
  const ghostGeo = new THREE.CapsuleGeometry(0.5, 1.4, 4, 8);
  const ghostMat = new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.55, emissive: 0x6fa8dc, emissiveIntensity: 0.8 });
  const ghost = new THREE.Mesh(ghostGeo, ghostMat);
  ghost.position.set(ghostPos.x, 1.2, ghostPos.z);
  scene.add(ghost);
  const ghostLight = new THREE.PointLight(0x6fa8dc, 1, 6);
  ghostLight.position.copy(ghost.position);
  scene.add(ghostLight);

  interactables.push({
    id: 'devimaa_ghost',
    type: 'npc',
    position: ghostPos,
    radius: 2.5,
    label: 'Speak with the ghost',
    once: false,
    mesh: ghost,
  });

  // --- Encounter zones ---
  encounterZones.push({
    id: 'kalini_scout_ambush',
    position: { x: -10, z: -14 },
    radius: 5,
    once: true,
    flag: 'kalini_scout_ambush_done',
    enemyIds: ['eclipse_scout', 'eclipse_scout'],
  });

  encounterZones.push({
    id: 'kalini_yaksha_boss',
    position: { x: 0, z: -26 },
    radius: 5,
    once: true,
    flag: 'kalini_yaksha_boss_done',
    requiresFlag: 'forge_cache_opened',
    enemyIds: ['corrupted_yaksha'],
    boss: true,
  });

  return {
    playerStart: { x: 0, z: 20, yaw: Math.PI },
    obstacles,
    interactables,
    encounterZones,
    ghostMesh: ghost,
  };
}
