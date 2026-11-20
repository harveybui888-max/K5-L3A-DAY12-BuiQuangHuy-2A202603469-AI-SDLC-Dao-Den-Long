// Simulation constants and tuning v1.2 (pure JS, browser-compatible)

export const TUNING = {
  player_speed: 6.0,
  jump_velocity: 7.0,
  gravity: -20.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2,
  dash_cooldown_s: 1.5,
  carry_capacity: 10,
  capacity_max: 20,
  lantern_cost: 10,
  relight_cost: 5,
  fuel_max: 100,
  fuel_decay_per_s: 1.0,
  fuel_per_mote: 10,
  drain_per_s: 5,
  low_fuel_threshold: 30,
  win_ratio: 0.6,
  pickup_radius: 1.0,
  pickup_height: 1.5,
  interact_radius: 2.0,
  safe_radius: 6.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_stun_s: 2.0,
  pulse_push_m: 4.0,
  pulse_cooldown_s: 3.0,
  shade_speed: 4.0,
  shade_speed_night3: 4.5,
  shade_detect_radius: 12.0,
  shade_lose_radius: 18.0,
  shade_hit_radius: 1.0,
  invuln_s: 1.5,
  hit_drop_ratio: 0.5,
  flames: 3,
  night1_duration_s: 240,
  night2_duration_s: 270,
  night3_duration_s: 300,
  fall_enabled: true,
  score: {
    per_deposit: 5,
    per_first_light: 100,
    per_relight: 40,
    per_stun: 5,
    per_stun_drain: 15,
    per_lit_lantern_base: 50,
    per_flame_left: 50
  }
};

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

// Generate points by angle from +X counter-clockwise on XZ plane: x = r*cos(a), z = -r*sin(a) or standard (x=r*cos(a), z=r*sin(a))
// Ticket specifies: "Góc đo từ trục +X, ngược chiều kim đồng hồ khi nhìn từ trên xuống, trên mặt phẳng XZ."
// Looking from top (+Y down): +X is right, -Z is up (or +Z is down). In standard math with X, Z: x = r*cos(rad), z = -r*sin(rad)
function radialPoints(cx, cz, r, y, anglesDeg) {
  return anglesDeg.map(deg => {
    const rad = (deg * Math.PI) / 180;
    return [round3(cx + r * Math.cos(rad)), y, round3(cz - r * Math.sin(rad))];
  });
}

// Map definitions
export const MAPS = {
  1: {
    name: "Đảo Bến",
    duration_s: 240,
    spawn_player: [0, 0, 0],
    lanterns: [
      { id: "L1", pos: [0, 0, 25] },
      { id: "L2", pos: [23.8, 0, 7.7] },
      { id: "L3", pos: [14.7, 0, -20.2] },
      { id: "L4", pos: [-14.7, 0, -20.2] },
      { id: "L5", pos: [-23.8, 0, 7.7] }
    ],
    mote_spots: [
      ...radialPoints(0, 0, 12, 0.5, [0, 45, 90, 135, 180, 225, 270, 315]),
      ...radialPoints(0, 0, 33, 0.5, Array.from({ length: 16 }, (_, i) => i * 22.5))
    ],
    shade_spots: radialPoints(0, 0, 37, 0, Array.from({ length: 12 }, (_, i) => 15 + i * 30)),
    shade_spawn_interval_ticks: 480, // every 8s
    max_shades: 6,
    charms: [],
    jump_pads: [],
    has_drifters: false
  },
  2: {
    name: "Đảo Cau",
    duration_s: 270,
    spawn_player: [0, 0, 0],
    lanterns: [
      { id: "L1", pos: [0, 0, 20] },
      { id: "L2", pos: [17, 0, -10] },
      { id: "L3", pos: [-17, 0, -10] },
      { id: "L4", pos: [70, 0, 20] },
      { id: "L5", pos: [87, 0, -10] },
      { id: "L6", pos: [53, 0, -10] }
    ],
    mote_spots: [
      // Island A
      ...radialPoints(0, 0, 10, 0.5, [0, 90, 180, 270]),
      ...radialPoints(0, 0, 22, 0.5, [0, 45, 90, 135, 180, 225, 270, 315]),
      // Island B
      ...radialPoints(70, 0, 10, 0.5, [0, 90, 180, 270]),
      ...radialPoints(70, 0, 22, 0.5, [0, 45, 90, 135, 180, 225, 270, 315])
    ],
    shade_spots: [
      ...radialPoints(0, 0, 26, 0, Array.from({ length: 8 }, (_, i) => 22.5 + i * 45)),
      ...radialPoints(70, 0, 26, 0, Array.from({ length: 8 }, (_, i) => 22.5 + i * 45))
    ],
    shade_spawn_interval_ticks: 420, // every 7s
    max_shades: 8,
    charms: [{ id: "C1", pos: [35, 0, 0] }],
    jump_pads: [
      {
        pos: [20, 0, 18],
        radius: 1.0,
        vel_y: 14.0,
        target: [70, 0, 0],
        speed_horiz: 24.0
      },
      {
        pos: [50, 0, -18],
        radius: 1.0,
        vel_y: 14.0,
        target: [0, 0, 0],
        speed_horiz: 24.0
      }
    ],
    has_drifters: true
  },
  3: {
    name: "Đảo Chuông",
    duration_s: 300,
    spawn_player: [0, 0, 0],
    lanterns: [
      { id: "L1", pos: [0, 6, 6] },
      { id: "L2", pos: [18, 3, 10] },
      { id: "L3", pos: [-18, 3, 10] },
      { id: "L4", pos: [35, 0, -10] },
      { id: "L5", pos: [-35, 0, -10] },
      { id: "L6", pos: [20, 0, -35] },
      { id: "L7", pos: [-20, 0, -35] }
    ],
    mote_spots: [
      // Tier 0: 18 points at r=34m
      ...radialPoints(0, 0, 34, 0.5, Array.from({ length: 18 }, (_, i) => i * 20)),
      // Tier 1: 8 points at r=18m, angles 20°..160° where z > 0
      ...radialPoints(0, 0, 18, 3.5, [20, 40, 60, 80, 100, 120, 140, 160]),
      // Tier 2: 4 points at r=5m
      ...radialPoints(0, 0, 5, 6.5, [45, 135, 225, 315])
    ],
    shade_spots: radialPoints(0, 0, 43, 0, Array.from({ length: 16 }, (_, i) => i * 22.5)),
    shade_spawn_interval_ticks: 360, // every 6s
    max_shades: 10,
    charms: [
      { id: "C1", pos: [30, 0, 25] },
      { id: "C2", pos: [-30, 0, 25] }
    ],
    jump_pads: [
      {
        pos: [0, 3, 13],
        radius: 1.0,
        vel_y: 12.0,
        vel_horiz: [0, -8.0] // 8 m/s in -Z
      }
    ],
    has_drifters: true,
    has_wind: true
  }
};
