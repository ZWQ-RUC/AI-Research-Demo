const { ChongqingCityGenerator, defaultState } = require('../src/city_core.js');

const smokeCases = [
  { name: '01-默认渝中半岛-蓝调黄昏', seed: 2026, citySize: 20, density: 80, cityStyle: 'dusk', landform: 'peninsula' },
  { name: '02-单江峡谷-魔幻霓虹夜', seed: 1001, citySize: 12, density: 45, cityStyle: 'neon', landform: 'gorge' },
  { name: '03-多山台地-雾都清晨', seed: 3088, citySize: 28, density: 95, cityStyle: 'mist', landform: 'terraces' },
  { name: '04-平坝河谷-山城烈日', seed: 4096, citySize: 18, density: 70, cityStyle: 'noon', landform: 'valley' },
  { name: '05-老重庆复古风', seed: 5120, citySize: 24, density: 85, cityStyle: 'retro', landform: 'peninsula' },
  { name: '06-江北嘴CBD高商业配比', seed: 6001, roadPattern: 'terraced', districtPreset: 'jiangbeizui', comRatio: 65, resRatio: 25, indRatio: 10 },
  { name: '07-南岸弹子石放射路网', seed: 7002, roadPattern: 'radial', districtPreset: 'nanan', avgHeight: 110, heightVar: 85, landmarkProb: 25 },
  { name: '08-九龙坡老工业区方格网', seed: 8003, roadPattern: 'grid', districtPreset: 'jiulongpo', avgHeight: 42, heightVar: 25, landmarkProb: 5 },
  { name: '09-极限山势高差与粗糙台地', seed: 9004, terrainHeight: 170, roughness: 85, terraceSteps: 90, riverWidth: 130, parkRatio: 25 },
  { name: '10-低矮缓坡窄江面', seed: 1111, terrainHeight: 45, roughness: 15, terraceSteps: 10, riverWidth: 70, parkRatio: 4 },
  { name: '11-最小立体交通配置', seed: 2222, interchangeLayers: 2, tunnelStations: 1, bridgeCount: 1, trafficDensity: 10, cableway: false },
  { name: '12-满配8D魔幻立体交通', seed: 3333, interchangeLayers: 5, tunnelStations: 4, bridgeCount: 6, trafficDensity: 100, cableway: true },
  { name: '13-高曝光强日光低雾气', seed: 4444, exposure: 150, ambient: 120, sunIntensity: 160, sunAngle: 65, fogDensity: 15, neonIntensity: 160 },
  { name: '14-浓雾暗夜高霓虹', seed: 5555, exposure: 80, ambient: 45, sunIntensity: 40, sunAngle: 6, fogDensity: 85, neonIntensity: 40 },
  { name: '15-标准全量参数回归测试', seed: 2026, citySize: 20, density: 80, blockSize: 100, roadPattern: 'freeform', districtPreset: 'yuzhong', comRatio: 40, resRatio: 46, indRatio: 14, avgHeight: 72, heightVar: 55, landmarkProb: 10, cityStyle: 'dusk', landform: 'peninsula', terrainHeight: 120, roughness: 40, terraceSteps: 60, riverWidth: 100, parkRatio: 9, interchangeLayers: 5, tunnelStations: 2, bridgeCount: 4, trafficDensity: 60, cableway: true }
];

const gen = new ChongqingCityGenerator();
console.log('=== 山城造物 (CHONGQING 8D CITY FORGE) 15 组参数冒烟测试 ===');
for (const tc of smokeCases) {
  const state = Object.assign({}, defaultState, tc);
  const res = gen.generate(state);
  if (!res || res.stats.buildings <= 0 || res.solidBuilder.count <= 0) {
    throw new Error('Smoke test failed on ' + tc.name);
  }
  console.log(`[PASS] ${tc.name.padEnd(22)} | 楼栋: ${String(res.stats.buildings).padStart(4)} 栋 | 高差: ${String(res.stats.maxElevation).padStart(3)}m | 三角面: ${res.stats.trianglesWan}万 | 树木: ${res.stats.trees} | 耗时: ${res.stats.buildMs}ms`);
}
console.log('=== 全部 15 组参数冒烟测试通过 (0 Errors) ===');
