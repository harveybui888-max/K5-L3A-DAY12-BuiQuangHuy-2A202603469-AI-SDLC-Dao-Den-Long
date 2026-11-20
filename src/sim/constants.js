// Simulation constants and default tuning (pure JS, browser-compatible)

export const TUNING = {
  player_speed: 6,
  carry_capacity: 10,
  lantern_cost: 5,
  lantern_count_night1: 5,
  pickup_radius: 1.5,
  interact_radius: 3,
  pulse_cost: 1,
  pulse_radius: 6,
  night1_duration_s: 300,
  flames: 3,
  invuln_s: 1.5,
  hit_drop_ratio: 0.5,
  pulse_stun_s: 2,
  pulse_push_m: 4,
  pulse_cooldown_s: 1,
  safe_radius: 5,
  shade_speed: 3.5,
  shade_hit_radius: 1,
  fall_enabled: false,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 20,
    per_second_left: 2,
    per_flame_left: 50
  }
};

export const WORLD = {
  island_radius: 40.0,
  lantern_ring_radius: 25.0,
  mote_inner_radius: 5.0,
  mote_outer_radius: 33.0,
  initial_motes_count: 30,
  mote_respawn_interval_ticks: 240, // 4s at 60Hz
  initial_shades_count: 2,
  shade_spawn_radius: 36.0,
  shade_spawn_interval_ticks: 1800, // 30s at 60Hz
  max_shades_count: 6,
  tick_hz: 60,
  dt: 1 / 60
};
