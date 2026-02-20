// Kitchen scene with interactive stations and ingredients
import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Kitchen {
  constructor(scene, chefAI) {
    this.scene = scene;
    this.chefAI = chefAI;
    
    // Interactive objects
    this.stations = [];
    this.ingredientSpawns = [];
    
    // Active ingredients in the world
    this.activeIngredients = new Map();
    
    // Load textures
    const textureLoader = new THREE.TextureLoader();
    this.textures = {
      floor: textureLoader.load('https://rosebud.ai/assets/kitchen_floor_tile.webp?Ho4f'),
      wall: textureLoader.load('https://rosebud.ai/assets/kitchen_wall_tile.webp?q8SZ'),
      metal: textureLoader.load('https://rosebud.ai/assets/brushed_metal_texture.webp?F7rU'),
      window: textureLoader.load('https://rosebud.ai/assets/kitchen_background_window_view.webp?BGbq')
    };

    // Configure textures
    this.textures.floor.wrapS = this.textures.floor.wrapT = THREE.RepeatWrapping;
    this.textures.floor.repeat.set(5, 5);
    
    this.textures.wall.wrapS = this.textures.wall.wrapT = THREE.RepeatWrapping;
    this.textures.wall.repeat.set(4, 2);

    this.createKitchen();
  }

  createKitchen() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(24, 24);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.floor,
      roughness: 0.4,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Back wall
    const wallGeometry = new THREE.PlaneGeometry(24, 12);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.wall,
      roughness: 0.6
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 6, -8);
    this.scene.add(wall);

    // Side walls
    const sideWallGeometry = new THREE.PlaneGeometry(24, 12);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-12, 6, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(12, 6, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);

    // Window
    this.createWindow();

    // Shelving/Cabinets at the top of the wall
    this.createCabinets();

    // Create stations
    this.createStation('KNIFE', -6, 0, -5, CONFIG.TOOLS.KNIFE);
    this.createStation('STOVE', 0, 0, -5, CONFIG.TOOLS.STOVE);
    this.createStation('PLATE', 6, 0, -5, CONFIG.TOOLS.PLATE);

    // Create ingredient counters
    this.createIngredientCounter('TOMATO', -6, 0, 1);
    this.createIngredientCounter('LETTUCE', -3, 0, 1);
    this.createIngredientCounter('CHEESE', 0, 0, 1);
    this.createIngredientCounter('BREAD', 3, 0, 1);
    this.createIngredientCounter('MEAT', 6, 0, 1);

    // Add some ceiling details (vent/lights)
    this.createCeilingDetails();
  }

  createWindow() {
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 6.5, -7.9);

    // Window frame
    const frameGeometry = new THREE.BoxGeometry(6, 4, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    windowGroup.add(frame);

    // Window view (the outside image)
    const viewGeometry = new THREE.PlaneGeometry(5.6, 3.6);
    const viewMaterial = new THREE.MeshBasicMaterial({ map: this.textures.window });
    const view = new THREE.Mesh(viewGeometry, viewMaterial);
    view.position.z = 0.05;
    windowGroup.add(view);

    // Glass sheen
    const glassGeometry = new THREE.PlaneGeometry(5.6, 3.6);
    const glassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.1, 
      roughness: 0
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.z = 0.11;
    windowGroup.add(glass);

    this.scene.add(windowGroup);
  }

  createCabinets() {
    const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    
    // Upper cabinets
    const cabinetGeometry = new THREE.BoxGeometry(4, 2.5, 1);
    
    for (let x = -10; x <= 10; x += 5) {
      if (Math.abs(x) < 2) continue; // Leave space for window
      const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
      cabinet.position.set(x, 10, -7.5);
      this.scene.add(cabinet);
    }
  }

  createCeilingDetails() {
    // Vent hood above stove
    const ventGroup = new THREE.Group();
    ventGroup.position.set(0, 8, -5);
    
    const hoodGeometry = new THREE.CylinderGeometry(1.2, 1.8, 1.5, 4);
    const hoodMaterial = new THREE.MeshStandardMaterial({ map: this.textures.metal, metalness: 0.8, roughness: 0.2 });
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.rotation.y = Math.PI / 4;
    ventGroup.add(hood);
    
    const pipeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 4, 16);
    const pipe = new THREE.Mesh(pipeGeometry, hoodMaterial);
    pipe.position.y = 2;
    ventGroup.add(pipe);
    
    this.scene.add(ventGroup);
  }

  createStation(id, x, y, z, toolConfig) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Counter base
    const counterGeometry = new THREE.BoxGeometry(2.2, 1.1, 1.8);
    const counterMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xecf0f1,
      roughness: 0.5
    });
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.y = 0.55;
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Counter top
    const topGeometry = new THREE.BoxGeometry(2.3, 0.1, 1.9);
    const topMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.metal,
      metalness: 0.6,
      roughness: 0.2
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.1;
    group.add(top);

    // Tool model
    let tool;
    let labelText = '';

    if (id === 'STOVE') {
      labelText = 'COOKING';
      const stoveGroup = new THREE.Group();
      // Burner
      const burnerGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
      const burnerMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const burner = new THREE.Mesh(burnerGeom, burnerMat);
      stoveGroup.add(burner);
      
      // Heating coil glow
      const coilGeom = new THREE.TorusGeometry(0.35, 0.05, 8, 32);
      const coilMat = new THREE.MeshStandardMaterial({ 
        color: 0xff4400, 
        emissive: 0xff2200, 
        emissiveIntensity: 2 
      });
      const coil = new THREE.Mesh(coilGeom, coilMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = 0.03;
      stoveGroup.add(coil);
      tool = stoveGroup;
    } else if (id === 'KNIFE') {
      labelText = 'CHOPPING';
      // Chopping board
      const boardGeom = new THREE.BoxGeometry(1.2, 0.1, 0.8);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.9 });
      const board = new THREE.Mesh(boardGeom, boardMat);
      
      // Small knife on top
      const knifeBladeGeom = new THREE.BoxGeometry(0.5, 0.02, 0.1);
      const knifeBladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
      const knifeBlade = new THREE.Mesh(knifeBladeGeom, knifeBladeMat);
      knifeBlade.position.set(0.2, 0.07, 0);
      board.add(knifeBlade);
      
      const handleGeom = new THREE.BoxGeometry(0.2, 0.03, 0.12);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const handle = new THREE.Mesh(handleGeom, handleMat);
      handle.position.set(-0.15, 0.07, 0);
      board.add(handle);
      
      tool = board;
    } else if (id === 'PLATE') {
      labelText = 'SERVING';
      // Large ceramic plate
      const plateGeom = new THREE.CylinderGeometry(0.7, 0.5, 0.1, 32);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const plate = new THREE.Mesh(plateGeom, plateMat);
      tool = plate;
    }
    
    tool.position.y = 1.2;
    group.add(tool);

    // Label
    const label = this.createLabel(labelText);
    label.position.set(0, 2.2, 0);
    group.add(label);

    this.scene.add(group);

    this.stations.push({
      id,
      toolConfig,
      position: new THREE.Vector3(x, y, z),
      mesh: group,
      tool,
      originalColor: 0xffffff, // used for reference in highlights
      disabled: false
    });
  }

  createIngredientCounter(ingredientId, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const ingredient = CONFIG.INGREDIENTS[ingredientId];

    // Counter base
    const counterGeometry = new THREE.BoxGeometry(1.6, 1.1, 1.6);
    const counterMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xecf0f1,
      roughness: 0.5
    });
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.y = 0.55;
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Counter top
    const topGeometry = new THREE.BoxGeometry(1.7, 0.1, 1.7);
    const topMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.metal,
      metalness: 0.6,
      roughness: 0.2
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.1;
    group.add(top);

    // Ingredient display
    const ingredientMesh = this.createIngredientModel(ingredientId);
    ingredientMesh.position.y = 1.4;
    group.add(ingredientMesh);

    // Label
    const label = this.createLabel(ingredient.name);
    label.position.set(0, 2.2, 0);
    group.add(label);

    this.scene.add(group);

    this.ingredientSpawns.push({
      ingredientId,
      position: new THREE.Vector3(x, y, z),
      mesh: group,
      displayMesh: ingredientMesh,
      originalColor: ingredient.color
    });
  }

  createLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    // Background bubble
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.roundRect(0, 32, 256, 64, 20);
    context.fill();

    // Text
    context.font = 'Bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
    context.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    return sprite;
  }

  // Create ingredient 3D model based on type (reusing logic but adding scale)
  createIngredientModel(ingredientId) {
    const ingredient = CONFIG.INGREDIENTS[ingredientId];
    const group = new THREE.Group();
    
    switch (ingredientId) {
      case 'TOMATO':
        const tomatoGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        tomatoGeometry.scale(1, 0.9, 1);
        const tomatoMaterial = new THREE.MeshStandardMaterial({ color: ingredient.color, roughness: 0.3 });
        const tomato = new THREE.Mesh(tomatoGeometry, tomatoMaterial);
        group.add(tomato);
        const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.15, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.4;
        group.add(stem);
        break;
      case 'LETTUCE':
        for (let i = 0; i < 4; i++) {
          const leafGeometry = new THREE.SphereGeometry(0.25 + i * 0.05, 8, 8);
          leafGeometry.scale(1.2, 0.3, 1.2);
          const leafMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(ingredient.color).multiplyScalar(0.8 + i * 0.1), flatShading: true });
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          leaf.position.y = i * 0.08;
          leaf.rotation.y = i * 0.5;
          group.add(leaf);
        }
        break;
      case 'CHEESE':
        const cheeseShape = new THREE.Shape();
        cheeseShape.moveTo(0, 0); cheeseShape.lineTo(0.5, 0); cheeseShape.lineTo(0.25, 0.4); cheeseShape.lineTo(0, 0);
        const cheeseGeometry = new THREE.ExtrudeGeometry(cheeseShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
        const cheeseMaterial = new THREE.MeshStandardMaterial({ color: ingredient.color });
        const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
        cheese.rotation.x = Math.PI / 2; cheese.position.set(-0.25, 0, -0.2);
        group.add(cheese);
        break;
      case 'BREAD':
        const breadGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.4);
        const breadMaterial = new THREE.MeshStandardMaterial({ color: ingredient.color });
        const bread = new THREE.Mesh(breadGeometry, breadMaterial);
        bread.position.y = 0.15;
        group.add(bread);
        const topGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16, 1, false, 0, Math.PI);
        const btop = new THREE.Mesh(topGeometry, breadMaterial);
        btop.rotation.z = Math.PI / 2; btop.position.y = 0.3;
        group.add(btop);
        break;
      case 'MEAT':
        const meatGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
        const meatMaterial = new THREE.MeshStandardMaterial({ color: ingredient.color });
        const meat = new THREE.Mesh(meatGeometry, meatMaterial);
        meat.position.y = 0.1;
        group.add(meat);
        break;
      default:
        const defaultGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        group.add(new THREE.Mesh(defaultGeometry, new THREE.MeshStandardMaterial({ color: ingredient.color })));
    }
    
    group.scale.set(1.2, 1.2, 1.2);
    return group;
  }

  spawnIngredient(ingredientId, position) {
    const mesh = this.createIngredientModel(ingredientId);
    mesh.position.copy(position);
    mesh.position.y = 1.5;
    this.scene.add(mesh);
    const id = Math.random().toString(36);
    this.activeIngredients.set(id, { id, ingredientId, mesh, state: 'raw' });
    return id;
  }

  removeIngredient(id) {
    const ingredient = this.activeIngredients.get(id);
    if (ingredient) {
      this.scene.remove(ingredient.mesh);
      this.activeIngredients.delete(id);
    }
  }

  getIngredient(id) { return this.activeIngredients.get(id); }

  processIngredient(ingredientId, state, stationId) {
    const station = this.stations.find(s => s.id === stationId);
    if (!station) return state;
    const ingredient = CONFIG.INGREDIENTS[ingredientId];
    const tool = station.toolConfig;
    if (tool.action === 'chop' && ingredient.canChop && state === 'raw') return 'chopped';
    else if (tool.action === 'cook' && ingredient.canCook && (state === 'raw' || state === 'chopped')) return 'cooked';
    return state;
  }

  updateBannedVisuals() {
    const setMaterialProperties = (obj, colorHex, emissiveHex, emissiveIntensity) => {
      obj.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.setHex(colorHex);
          child.material.emissive.setHex(emissiveHex);
          child.material.emissiveIntensity = emissiveIntensity;
        }
      });
    };

    for (const spawn of this.ingredientSpawns) {
      const isBanned = this.chefAI.isIngredientBanned(spawn.ingredientId);
      setMaterialProperties(spawn.displayMesh, isBanned ? CONFIG.COLORS.BANNED : spawn.originalColor, isBanned ? 0xff0000 : 0x000000, isBanned ? 0.3 : 0);
    }

    for (const station of this.stations) {
      const isBanned = this.chefAI.isToolBanned(station.id);
      // Use the same traverse method for stations since tool can be a Group or Mesh
      setMaterialProperties(station.tool, isBanned ? CONFIG.COLORS.BANNED : station.originalColor, isBanned ? 0xff0000 : 0x000000, isBanned ? 0.5 : 0);
    }
  }

  findNearestInteractable(position, maxDistance = 2.5) {
    let nearest = null;
    let minDist = maxDistance;

    for (const spawn of this.ingredientSpawns) {
      const dist = position.distanceTo(spawn.position);
      if (dist < minDist && !this.chefAI.isIngredientBanned(spawn.ingredientId)) {
        minDist = dist; nearest = { type: 'ingredient', data: spawn };
      }
    }

    for (const station of this.stations) {
      const dist = position.distanceTo(station.position);
      if (dist < minDist && !this.chefAI.isToolBanned(station.id) && !station.disabled) {
        minDist = dist; nearest = { type: 'station', data: station };
      }
    }
    return nearest;
  }

  highlightObject(object, highlight = true) {
    if (!object) return;
    const targetMesh = object.type === 'ingredient' ? object.data.displayMesh : object.data.tool;
    const setEmissive = (obj, hex, intensity) => {
      obj.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive.setHex(hex);
          child.material.emissiveIntensity = intensity;
        }
      });
    };
    if (highlight) setEmissive(targetMesh, CONFIG.COLORS.HIGHLIGHT, 0.4);
    else {
      const isBanned = object.type === 'ingredient' ? this.chefAI.isIngredientBanned(object.data.ingredientId) : this.chefAI.isToolBanned(object.data.id);
      setEmissive(targetMesh, isBanned ? 0xff0000 : 0x000000, isBanned ? 0.3 : 0);
    }
  }
}

