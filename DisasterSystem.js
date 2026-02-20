// Kitchen Disaster Event System
import * as THREE from 'three';
import { CONFIG } from './config.js';

export class DisasterSystem {
  constructor(scene, kitchen, chefAI, onDisasterStart, onDisasterEnd) {
    this.scene = scene;
    this.kitchen = kitchen;
    this.chefAI = chefAI;
    this.onDisasterStart = onDisasterStart;
    this.onDisasterEnd = onDisasterEnd;
    
    // Disaster state
    this.activeDisaster = null;
    this.disasterTimer = 0;
    this.timeSinceLastDisaster = 0;
    this.disastersTriggered = 0;
    
    // Disaster configuration
    this.config = {
      MIN_TIME_BETWEEN: 45, // Seconds between disasters
      INITIAL_CHANCE: 0.05, // 5% chance per check
      ESCALATION_MULTIPLIER: 1.3, // Increases with escalation
      CHECK_INTERVAL: 10 // Check every 10 seconds
    };
    
    // Emergency items
    this.emergencyItems = new Map();
    
    // Visual effects
    this.fireParticles = [];
    this.sparks = [];
    this.smokeParticles = [];
    this.extinguisherSpray = [];
    this.gasLeakSmoke = [];
  }

  update(deltaTime) {
    this.timeSinceLastDisaster += deltaTime;
    
    // Check for new disasters
    if (!this.activeDisaster && this.shouldTriggerDisaster()) {
      this.triggerRandomDisaster();
    }
    
    // Update active disaster
    if (this.activeDisaster) {
      this.disasterTimer -= deltaTime;
      this.updateDisasterEffects(deltaTime);
      
      // Auto-fail if time runs out
      if (this.disasterTimer <= 0 && !this.activeDisaster.resolved) {
        this.failDisaster();
      }
    }
  }

  shouldTriggerDisaster() {
    if (this.timeSinceLastDisaster < this.config.MIN_TIME_BETWEEN) {
      return false;
    }
    
    // Increase chance with escalation level
    const escalationBonus = this.chefAI.escalationLevel * 0.02;
    const chance = this.config.INITIAL_CHANCE + escalationBonus;
    
    // Random check every interval
    const checksPassed = Math.floor(this.timeSinceLastDisaster / this.config.CHECK_INTERVAL);
    if (checksPassed > 0 && Math.random() < chance) {
      return true;
    }
    
    return false;
  }

  triggerRandomDisaster() {
    const disasters = [
      { type: 'FIRE', weight: 0.35 },
      { type: 'POWER_OUTAGE', weight: 0.30 },
      { type: 'GAS_LEAK', weight: 0.20 },
      { type: 'FLOOD', weight: 0.15 }
    ];
    
    // Weighted random selection
    const totalWeight = disasters.reduce((sum, d) => sum + d.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const disaster of disasters) {
      random -= disaster.weight;
      if (random <= 0) {
        this.startDisaster(disaster.type);
        break;
      }
    }
  }

  startDisaster(type) {
    this.timeSinceLastDisaster = 0;
    this.disastersTriggered++;
    
    const disasterConfig = this.getDisasterConfig(type);
    
    this.activeDisaster = {
      type: type,
      config: disasterConfig,
      startTime: Date.now(),
      resolved: false,
      requiredItem: disasterConfig.requiredItem,
      timeLimit: disasterConfig.timeLimit
    };
    
    this.disasterTimer = disasterConfig.timeLimit;
    
    // Spawn emergency item
    if (disasterConfig.requiredItem) {
      this.spawnEmergencyItem(disasterConfig.requiredItem);
    }
    
    // Start visual effects
    this.startDisasterEffects(type);
    
    // Apply disaster effects to kitchen
    this.applyDisasterEffects(disasterConfig);
    
    // Notify game
    if (this.onDisasterStart) {
      this.onDisasterStart(type, disasterConfig);
    }
  }

  getDisasterConfig(type) {
    const configs = {
      FIRE: {
        name: 'Kitchen Fire!',
        description: 'A fire has broken out near the stove! Find the fire extinguisher!',
        requiredItem: 'FIRE_EXTINGUISHER',
        timeLimit: 20,
        disabledStations: ['STOVE'],
        penalty: 200,
        visualEffect: 'fire',
        location: { x: 0, y: 0, z: -3 },
        dangerZone: 3
      },
      POWER_OUTAGE: {
        name: 'Power Outage!',
        description: 'The power is out! Find the backup generator!',
        requiredItem: 'GENERATOR',
        timeLimit: 25,
        disabledStations: ['STOVE'],
        penalty: 150,
        visualEffect: 'darkness',
        location: { x: -6, y: 0, z: 2 },
        dangerZone: 0
      },
      GAS_LEAK: {
        name: 'Gas Leak!',
        description: 'Dangerous gas is leaking! Shut off the valve quickly!',
        requiredItem: 'VALVE_WRENCH',
        timeLimit: 15,
        disabledStations: ['STOVE'],
        penalty: 300,
        visualEffect: 'gas',
        location: { x: 0, y: 0, z: -3 },
        dangerZone: 4
      },
      FLOOD: {
        name: 'Pipe Burst!',
        description: 'Water is flooding the kitchen! Find the shutoff valve!',
        requiredItem: 'PIPE_WRENCH',
        timeLimit: 20,
        disabledStations: ['PLATE'],
        penalty: 150,
        visualEffect: 'water',
        location: { x: 6, y: 0, z: -3 },
        dangerZone: 2
      }
    };
    
    return configs[type];
  }

  spawnEmergencyItem(itemType) {
    // Spawn location - opposite side of disaster
    const spawnLocations = [
      { x: 6, y: 0, z: 2 },   // Right side
      { x: -6, y: 0, z: 2 },  // Left side
      { x: 3, y: 0, z: 5 },   // Front right
      { x: -3, y: 0, z: 5 }   // Front left
    ];
    
    const location = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
    
    // Create emergency item mesh
    const group = new THREE.Group();
    group.position.set(location.x, location.y, location.z);
    
    // Item container (glowing box)
    const containerGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const containerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const container = new THREE.Mesh(containerGeometry, containerMaterial);
    container.position.y = 0.6;
    group.add(container);
    
    // Pulsing light
    const light = new THREE.PointLight(0xff0000, 2, 5);
    light.position.y = 0.6;
    group.add(light);
    
    // Label indicator
    const labelGeometry = new THREE.PlaneGeometry(1.5, 0.4);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 1.8, 0);
    group.add(label);
    
    this.scene.add(group);
    
    this.emergencyItems.set(itemType, {
      type: itemType,
      mesh: group,
      position: new THREE.Vector3(location.x, location.y, location.z),
      light: light
    });
  }

  startDisasterEffects(type) {
    const config = this.activeDisaster.config;
    
    switch (config.visualEffect) {
      case 'fire':
        this.createFireEffect(config.location);
        break;
      case 'darkness':
        this.createDarknessEffect();
        break;
      case 'gas':
        this.createGasEffect(config.location);
        break;
      case 'water':
        this.createWaterEffect(config.location);
        break;
    }
  }

  createFireEffect(location) {
    // Create fire particles
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff4500 : 0xffa500,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.set(
        location.x + (Math.random() - 0.5) * 2,
        1 + Math.random() * 2,
        location.z + (Math.random() - 0.5) * 2
      );
      
      particle.velocity = {
        y: 0.5 + Math.random() * 0.5,
        x: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2
      };
      
      this.scene.add(particle);
      this.fireParticles.push(particle);
    }
    
    // Fire light
    const fireLight = new THREE.PointLight(0xff4500, 3, 10);
    fireLight.position.set(location.x, 2, location.z);
    this.scene.add(fireLight);
    this.fireParticles.push(fireLight);
  }

  createDarknessEffect() {
    // Dim ambient light
    this.scene.traverse((obj) => {
      if (obj.isLight && obj.type === 'AmbientLight') {
        obj.originalIntensity = obj.intensity;
        obj.intensity *= 0.3;
      }
    });
  }

  createGasEffect(location) {
    // Create gas cloud particles with enhanced visuals
    for (let i = 0; i < 25; i++) {
      const geometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x90ee90,
        transparent: true,
        opacity: 0.4
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.set(
        location.x + (Math.random() - 0.5) * 2,
        0.3 + Math.random() * 0.5,
        location.z + (Math.random() - 0.5) * 2
      );
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.3;
      particle.velocity = {
        y: 0.3 + Math.random() * 0.3,
        x: Math.cos(angle) * speed,
        z: Math.sin(angle) * speed
      };
      
      particle.userData.lifetime = Math.random() * 2 + 2; // 2-4 seconds
      particle.userData.age = 0;
      
      this.scene.add(particle);
      this.gasLeakSmoke.push(particle);
    }
  }

  createWaterEffect(location) {
    // Create water spray particles
    for (let i = 0; i < 30; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.6
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.set(
        location.x,
        2 + Math.random(),
        location.z
      );
      
      const angle = Math.random() * Math.PI * 2;
      particle.velocity = {
        y: -0.5 - Math.random() * 0.5,
        x: Math.cos(angle) * 0.5,
        z: Math.sin(angle) * 0.5
      };
      
      this.scene.add(particle);
      this.sparks.push(particle);
    }
  }

  updateDisasterEffects(deltaTime) {
    // Check if disaster still active
    if (!this.activeDisaster) return;
    
    const config = this.activeDisaster.config;
    
    // Update fire particles
    this.fireParticles.forEach((particle, index) => {
      if (particle.velocity) {
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        
        particle.material.opacity -= deltaTime * 0.3;
        
        if (particle.position.y > 5 || particle.material.opacity <= 0) {
          // Reset particle
          particle.position.set(
            config.location.x + (Math.random() - 0.5) * 2,
            1,
            config.location.z + (Math.random() - 0.5) * 2
          );
          particle.material.opacity = 0.8;
        }
      }
    });
    
    // Update smoke/gas particles
    this.smokeParticles.forEach((particle) => {
      if (particle.velocity) {
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        
        particle.scale.multiplyScalar(1 + deltaTime * 0.5);
        particle.material.opacity -= deltaTime * 0.2;
        
        if (particle.position.y > 4 || particle.material.opacity <= 0) {
          particle.position.set(
            config.location.x + (Math.random() - 0.5) * 3,
            0.5,
            config.location.z + (Math.random() - 0.5) * 3
          );
          particle.scale.set(1, 1, 1);
          particle.material.opacity = 0.3;
        }
      }
    });
    
    // Update gas leak smoke (enhanced)
    this.gasLeakSmoke.forEach((particle, index) => {
      if (particle.velocity && particle.userData) {
        particle.userData.age += deltaTime;
        
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        
        // Expand and fade as it ages
        const lifeRatio = particle.userData.age / particle.userData.lifetime;
        particle.scale.setScalar(1 + lifeRatio * 2);
        particle.material.opacity = 0.4 * (1 - lifeRatio);
        
        // Reset if too old or too high
        if (particle.userData.age >= particle.userData.lifetime || particle.position.y > 5) {
          if (config) {
            particle.position.set(
              config.location.x + (Math.random() - 0.5) * 2,
              0.3 + Math.random() * 0.5,
              config.location.z + (Math.random() - 0.5) * 2
            );
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.3;
            particle.velocity = {
              y: 0.3 + Math.random() * 0.3,
              x: Math.cos(angle) * speed,
              z: Math.sin(angle) * speed
            };
            particle.userData.age = 0;
            particle.scale.set(1, 1, 1);
          }
        }
      }
    });
    
    // Update extinguisher spray
    this.extinguisherSpray.forEach((particle, index) => {
      if (particle.velocity && particle.userData) {
        particle.userData.age += deltaTime;
        
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        
        // Apply gravity
        particle.velocity.y -= 2 * deltaTime;
        
        // Expand and fade
        const lifeRatio = particle.userData.age / particle.userData.lifetime;
        particle.scale.setScalar(0.8 + lifeRatio * 0.5);
        particle.material.opacity = 0.9 * (1 - lifeRatio);
        
        // Remove if lifetime exceeded
        if (particle.userData.age >= particle.userData.lifetime) {
          this.scene.remove(particle);
          this.extinguisherSpray.splice(index, 1);
        }
      }
    });
    
    // Update water particles
    this.sparks.forEach((particle) => {
      if (particle.velocity) {
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        
        if (particle.position.y < 0.1 && config) {
          particle.position.set(
            config.location.x,
            2 + Math.random(),
            config.location.z
          );
          const angle = Math.random() * Math.PI * 2;
          particle.velocity = {
            y: -0.5 - Math.random() * 0.5,
            x: Math.cos(angle) * 0.5,
            z: Math.sin(angle) * 0.5
          };
        }
      }
    });
    
    // Pulse emergency item light
    this.emergencyItems.forEach((item) => {
      if (item.light) {
        item.light.intensity = 2 + Math.sin(Date.now() * 0.005) * 1;
      }
    });
  }

  applyDisasterEffects(config) {
    // Disable affected stations
    if (config.disabledStations) {
      config.disabledStations.forEach(stationId => {
        this.kitchen.disableStation(stationId);
      });
    }
  }

  canPickupEmergencyItem(playerPosition, itemType) {
    const item = this.emergencyItems.get(itemType);
    if (!item) return false;
    
    const distance = playerPosition.distanceTo(item.position);
    return distance < 2;
  }

  pickupEmergencyItem(itemType) {
    const item = this.emergencyItems.get(itemType);
    if (!item) return false;
    
    // Remove from scene
    this.scene.remove(item.mesh);
    this.emergencyItems.delete(itemType);
    
    return true;
  }

  useEmergencyItem(itemType, playerPosition, playerRotation) {
    if (!this.activeDisaster) return false;
    if (this.activeDisaster.requiredItem !== itemType) return false;
    
    const config = this.activeDisaster.config;
    const disasterPos = new THREE.Vector3(
      config.location.x,
      config.location.y,
      config.location.z
    );
    
    const distance = playerPosition.distanceTo(disasterPos);
    
    if (distance < config.dangerZone + 2) {
      // Create visual effect based on item type
      if (itemType === 'FIRE_EXTINGUISHER') {
        this.createExtinguisherSpray(playerPosition, playerRotation, disasterPos);
      } else if (itemType === 'VALVE_WRENCH') {
        this.createGasLeakStopping();
      }
      
      this.resolveDisaster(true);
      return true;
    }
    
    return false;
  }

  resolveDisaster(success) {
    if (!this.activeDisaster) return;
    
    this.activeDisaster.resolved = true;
    
    if (success) {
      // Successful resolution
      this.cleanupDisaster();
      
      if (this.onDisasterEnd) {
        this.onDisasterEnd(true, 0, this.activeDisaster.type);
      }
    } else {
      this.failDisaster();
    }
    
    this.activeDisaster = null;
  }

  failDisaster() {
    if (!this.activeDisaster) return;
    
    const penalty = this.activeDisaster.config.penalty;
    this.cleanupDisaster();
    
    if (this.onDisasterEnd) {
      this.onDisasterEnd(false, penalty, this.activeDisaster.type);
    }
    
    this.activeDisaster = null;
  }

  createExtinguisherSpray(playerPos, playerRotation, targetPos) {
    // Create white foam spray particles from player toward fire
    const direction = new THREE.Vector3()
      .subVectors(targetPos, playerPos)
      .normalize();
    
    for (let i = 0; i < 40; i++) {
      const geometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: 0xf0f0f0,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);
      
      // Start at player position
      particle.position.copy(playerPos);
      particle.position.y += 1; // Chest height
      
      // Spray in cone toward target
      const spread = 0.3;
      const speedVariance = 0.5;
      particle.velocity = {
        x: direction.x * (3 + Math.random() * speedVariance) + (Math.random() - 0.5) * spread,
        y: direction.y * (3 + Math.random() * speedVariance) + (Math.random() - 0.5) * spread,
        z: direction.z * (3 + Math.random() * speedVariance) + (Math.random() - 0.5) * spread
      };
      
      particle.userData.lifetime = 0.5 + Math.random() * 0.3; // 0.5-0.8 seconds
      particle.userData.age = 0;
      
      this.scene.add(particle);
      this.extinguisherSpray.push(particle);
    }
  }

  createGasLeakStopping() {
    // Create a burst effect when gas valve is closed
    if (!this.activeDisaster) return;
    
    const config = this.activeDisaster.config;
    for (let i = 0; i < 15; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x90ee90,
        transparent: true,
        opacity: 0.6
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.set(
        config.location.x,
        0.5,
        config.location.z
      );
      
      const angle = (i / 15) * Math.PI * 2;
      particle.velocity = {
        x: Math.cos(angle) * 2,
        y: 0.5 + Math.random(),
        z: Math.sin(angle) * 2
      };
      
      particle.userData.lifetime = 0.8;
      particle.userData.age = 0;
      
      this.scene.add(particle);
      this.gasLeakSmoke.push(particle);
    }
  }

  cleanupDisaster() {
    // Remove all visual effects
    this.fireParticles.forEach(particle => this.scene.remove(particle));
    this.smokeParticles.forEach(particle => this.scene.remove(particle));
    this.sparks.forEach(particle => this.scene.remove(particle));
    this.extinguisherSpray.forEach(particle => this.scene.remove(particle));
    this.gasLeakSmoke.forEach(particle => this.scene.remove(particle));
    
    this.fireParticles = [];
    this.smokeParticles = [];
    this.sparks = [];
    this.extinguisherSpray = [];
    this.gasLeakSmoke = [];
    
    // Restore lighting
    this.scene.traverse((obj) => {
      if (obj.isLight && obj.originalIntensity) {
        obj.intensity = obj.originalIntensity;
        delete obj.originalIntensity;
      }
    });
    
    // Re-enable stations
    if (this.activeDisaster && this.activeDisaster.config.disabledStations) {
      this.activeDisaster.config.disabledStations.forEach(stationId => {
        this.kitchen.enableStation(stationId);
      });
    }
    
    // Remove emergency items
    this.emergencyItems.forEach((item) => {
      this.scene.remove(item.mesh);
    });
    this.emergencyItems.clear();
  }

  getActiveDisaster() {
    return this.activeDisaster;
  }

  getTimeRemaining() {
    return Math.max(0, this.disasterTimer);
  }

  hasEmergencyItem(itemType) {
    return this.emergencyItems.has(itemType);
  }

  findNearestEmergencyItem(playerPosition) {
    let nearest = null;
    let minDist = 2;
    
    this.emergencyItems.forEach((item) => {
      const dist = playerPosition.distanceTo(item.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = { type: item.type, data: item };
      }
    });
    
    return nearest;
  }
}
