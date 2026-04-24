import { useEffect, useRef, useState } from 'react';
import { CONTROLLER_CONFIGS, DT, INITIAL_PARAMS, getDefaultParams } from '../simulator/controllerConfigs.js';
import { calcGLWeights, fal, gaussNoise, getMembership } from '../simulator/math.js';
import {
  applyActuatorDeadzone,
  getDelayedCommand,
  getInputShapingCoefficients,
  getReferenceValue,
  getTargetSignal,
  hasSettled,
  shouldShowReference
} from '../simulator/runtime.js';
import {
  CATEGORY_LABELS,
  PLANT_PARAMETER_LABELS,
  UI_TEXT
} from '../i18n/uiText.js';

const PlayIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
        const PauseIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>);
        const RefreshCwIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const ActivityIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>);
        const SettingsIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>);
        const InfoIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
        const ZapIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>);
const GitHubIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.92.58.11.79-.25.79-.56 0-.27-.01-1.18-.02-2.14-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.69.08-.69 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.3 1.19-3.12-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.19 1.19a10.94 10.94 0 0 1 5.8 0c2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.24 2.76.12 3.05.74.82 1.19 1.86 1.19 3.12 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.66 18.35.5 12 .5Z"></path></svg>);

const REPOSITORY_URL = 'https://github.com/cool-koala/Control-Theory-Simulator';
const STAR_URL = `${REPOSITORY_URL}/stargazers`;
const FORK_URL = `${REPOSITORY_URL}/fork`;
const ISSUES_URL = `${REPOSITORY_URL}/issues`;

export default function ControlSimulator() {
            const [running, setRunning] = useState(false);
            const [method, setMethod] = useState('PID');
            const [physParams, setPhysParams] = useState(INITIAL_PARAMS);
            const [ctrlParams, setCtrlParams] = useState(getDefaultParams('PID'));
            const [language, setLanguage] = useState(() => {
                if (typeof window === 'undefined') {
                    return 'zh';
                }

                return window.localStorage.getItem('controller-simulator-language') || 'zh';
            });
            
            const [targetMode, setTargetMode] = useState('step');
            const [contDisturbance, setContDisturbance] = useState(0);
            const [initialX, setInitialX] = useState(0);
            const [actuatorLimit, setActuatorLimit] = useState(200);
            const [sensorNoise, setSensorNoise] = useState(0);
            
            const [coulombFriction, setCoulombFriction] = useState(0);
            const [actuatorDeadzone, setActuatorDeadzone] = useState(0);
            const [plantDelay, setPlantDelay] = useState(0);

            const stateRef = useRef({ x: 0, v: 0, t: 0, alg: {} });
            const historyRef = useRef([]);
            const chartStateRef = useRef({ frozen: false, freezeTimer: 0 });
            const impulseRef = useRef(0);

            const simCanvasRef = useRef(null);
            const posChartCanvasRef = useRef(null);
            const ctrlChartCanvasRef = useRef(null);
            const requestRef = useRef();
            const uiStateRef = useRef({ language: 'zh', text: UI_TEXT.zh });
            const t = UI_TEXT[language];
            const plantParameterLabels = PLANT_PARAMETER_LABELS[language];

            useEffect(() => {
                uiStateRef.current = { language, text: UI_TEXT[language] };
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('controller-simulator-language', language);
                    document.title = UI_TEXT[language].documentTitle;
                }
            }, [language]);

            const resetAlgState = (_methodName, currTarget = 5.0) => {
                stateRef.current.alg = {
                    integral: 0, e_prev: 0, e_prev2: 0, u_prev: 0, u_prev2: 0, x_prev: 0, v_prev: 0,
                    d_hat: 0, st_int: 0, 
                    z1: 0, z2: 0, z3: 0, xm: 0, vm: 0, theta_r: 0, theta_x: 0, theta_v: 0, 
                    u_l1_filter: 0, w1: 0.33, w2: 0.33, w3: 0.33, 
                    m_hat: 1.0, k_hat: 1.0, c_hat: 0.5, 
                    vm_imc: 0, xm_imc: 0, phi: 0.5, K_hat: 0, F_hat_f: 0,
                    e_hist: new Array(50).fill(0), z_dsc: 0, u_esc_bias: 0,
                    P_k: [[1,0],[0,1]], x_kf: 0, v_kf: 0, u_qft_prev: 0, theta_hat_ii: 0,
                    last_target: currTarget, t_target: 0, xd: 0, vd: 0,
                    last_e_etc: 0, last_u_etc: 0,
                    z0_lev: 0, z1_lev: 0,
                    rmse_sum: 0, energy: 0, ticks: 0,
                    V_belbic: 0, W_belbic: 0,
                    wc_adp: 1.0, wa_adp: 40.0, wd_adp: 10.0, 
                    ilc_memory: new Array(1000).fill(0), ilc_idx: 0,
                    rep_queue: new Array(50).fill(0), rep_idx: 0,
                    switch_state: 0, last_switch_time: -999,
                    target_history: [],
                    
                    x_delay_buf: new Array(200).fill(0),
                    u_delay_buf: new Array(200).fill(0),
                    u_hw_buffer: new Array(100).fill(0),
                    H_hormone: 0, P_sdre: 10.0, chi_nuss: 0, amd_x: 0, amd_v: 0, fault_time: 0,
                    l_x: 0, l_v: 0, mj_mode: 1, st_next: 0, f_int: 0, u_hold: 0,
                    
                    // RBF, RL, RLS 特定状态
                    w_rbf: new Array(5).fill(0.1), w_actor: [0, 0, 0], w_critic: [0, 0, 0],
                    P_rls: [[100, 0], [0, 100]], theta_rls: [1.0, 0.5],
                    
                    l_x_l: 0.1, l_y_l: 0.1, l_z_l: 0.1, pf_particles: new Array(20).fill(0), f_adrc_z: 0
                };
            };

            const loopStateRef = useRef({ running, method, physParams, ctrlParams, targetMode, contDisturbance, actuatorLimit, sensorNoise, coulombFriction, actuatorDeadzone, plantDelay });
            useEffect(() => { loopStateRef.current = { running, method, physParams, ctrlParams, targetMode, contDisturbance, actuatorLimit, sensorNoise, coulombFriction, actuatorDeadzone, plantDelay }; }, [running, method, physParams, ctrlParams, targetMode, contDisturbance, actuatorLimit, sensorNoise, coulombFriction, actuatorDeadzone, plantDelay]);

            const triggerDisturbance = () => {
                impulseRef.current = 150.0; 
                chartStateRef.current.frozen = false;
                chartStateRef.current.freezeTimer = 0;
            };

            const calculateControlOutput = (dt, x, v, target, pP, cP, alg, currentMethod, currTime) => {
                const e = target - x;
                let u = 0;
                
                let target_changed = false;
                if (Math.abs(target - alg.last_target) > 0.01) {
                    alg.last_target = target;
                    alg.t_target = 0; alg.xd = x; alg.vd = v; alg.ilc_idx = 0;
                    if(alg.e0 === undefined) { alg.e0 = e; alg.v0 = v; } 
                    target_changed = true;
                }
                alg.t_target += dt;

                if (currentMethod === 'InputShaping' || currentMethod === 'Posicast') {
                    if (target_changed || alg.target_history.length === 0) alg.target_history.push({ t: currTime, val: target });
                }
                
                alg.x_delay_buf.unshift(x); alg.x_delay_buf.pop();
                alg.u_delay_buf.unshift(alg.u_prev||0); alg.u_delay_buf.pop();
                
                alg.e_hist.unshift(e); alg.e_hist.pop();

                switch (currentMethod) {
                    case 'OpenLoop': u = pP.k * target; break;
                    case 'P': u = cP.kp * e; break;
                    case 'PI': alg.integral += e * dt; u = cP.kp * e + cP.ki * alg.integral; break;
                    case 'PD': u = cP.kp * e - cP.kd * v; break;
                    case 'PID': alg.integral = Math.max(-50, Math.min(50, alg.integral + e * dt)); u = cP.kp * e + cP.ki * alg.integral - cP.kd * v; break;
                    case 'IPD': alg.integral += e * dt; u = cP.ki * alg.integral - cP.kp * x - cP.kd * v; break;
                    case '2DOF-PID': alg.integral = Math.max(-50, Math.min(50, alg.integral + e * dt)); u = cP.kp * (cP.b * target - x) + cP.ki * alg.integral - cP.kd * v; break;
                    case 'IncPID': {
                        const delta_u = cP.kp * (e - (alg.e_prev||0)) + cP.ki * e + cP.kd * (e - 2 * (alg.e_prev||0) + (alg.e_prev2||0));
                        u = (alg.u_prev||0) + delta_u; alg.e_prev2 = alg.e_prev; alg.e_prev = e; break;
                    }
                    case 'PI-D':
                        alg.integral += e * dt; u = cP.kp * e + cP.ki * alg.integral - cP.kd * v; break;
                    case 'Nested-PID': {
                        const v_d = cP.kp_out * e; alg.integral += (v_d - v) * dt;
                        u = cP.kp_in * (v_d - v) + cP.ki_in * alg.integral + pP.k * target; break;
                    }

                    case 'PolePlacement': {
                        const k1 = pP.m * (cP.p1 * cP.p2) - pP.k; const k2 = pP.m * (cP.p1 + cP.p2) - pP.c;
                        u = -k1 * x - k2 * v + (k1 + pP.k) * target; break;
                    }
                    case 'LQR': {
                        const lqr_kp = Math.sqrt(cP.q_x / cP.r_weight); const lqr_kd = Math.sqrt(cP.q_v / cP.r_weight + 2 * pP.m * lqr_kp);
                        u = lqr_kp * e - lqr_kd * v; break;
                    }
                    case 'LQG': {
                        const y_meas = x + 0.1 * gaussNoise();
                        const a_kf = (alg.u_prev - pP.k * alg.x_kf - pP.c * alg.v_kf) / pP.m;
                        alg.x_kf += alg.v_kf * dt + 0.3 * (y_meas - alg.x_kf); alg.v_kf += a_kf * dt + 0.1 * (y_meas - alg.x_kf);
                        const lqg_kp = Math.sqrt(cP.q_x / cP.r_w); const lqg_kd = Math.sqrt(cP.q_v / cP.r_w + 2 * pP.m * lqg_kp);
                        u = lqg_kp * (target - alg.x_kf) - lqg_kd * alg.v_kf; break;
                    }
                    case 'LQR-I': {
                        alg.integral += e * dt;
                        const k_lqi_x = Math.sqrt(cP.q_x / 1.0); const k_lqi_v = Math.sqrt(cP.q_v / 1.0); const k_lqi_i = Math.sqrt(cP.q_i / 1.0);
                        u = k_lqi_x * e - k_lqi_v * v + k_lqi_i * alg.integral; break;
                    }
                    case 'MPC': {
                        const H = (cP.t_pred * cP.t_pred) / (2 * pP.m);
                        const x_free = x + v * cP.t_pred - H * (pP.c * v + pP.k * x);
                        u = (H * (target - x_free) + cP.lambda * pP.k * target) / (H * H + cP.lambda); break;
                    }
                    case 'Deadbeat':
                        u = (pP.m / (dt * dt)) * cP.kp_scale * e - (pP.m / dt + pP.c) * cP.kp_scale * v + pP.k * x; break;
                    case 'H-Infinity': {
                        const gamma_sq = cP.gamma * cP.gamma; const P22 = Math.sqrt(cP.q_x / Math.max(0.01, 1 - 1/gamma_sq)); const P12 = Math.sqrt(pP.m * P22);
                        u = P22 * e - P12 * v; break;
                    }
                    case 'QFT-LeadLag': {
                        const z_d = cP.zero; const p_d = cP.pole; const K_d = cP.gain;
                        const n0 = K_d * (2/dt + z_d); const n1 = K_d * (z_d - 2/dt); const d0 = 2/dt + p_d; const d1 = p_d - 2/dt;
                        u = (n0 * e + n1 * (alg.e_prev||0) - d1 * (alg.u_qft_prev||0)) / d0; alg.e_prev = e; alg.u_qft_prev = u; break;
                    }
                    case 'IMP-Servo': {
                        alg.integral += e * dt;
                        const k_imp_x = Math.sqrt(cP.q_x / cP.r_u); const k_imp_i = Math.sqrt(cP.q_e / cP.r_u); const k_imp_v = Math.sqrt(2 * pP.m * k_imp_x); 
                        u = -k_imp_x * x - k_imp_v * v + k_imp_i * alg.integral + pP.k * target; break;
                    }
                    case 'Preview': {
                        let f_sum = 0; for(let i=0; i<5; i++) f_sum += Math.pow(0.8, i) * target; 
                        u = cP.kp * e - cP.kd * v + cP.k_prev * f_sum; break;
                    }

                    case 'BangBang': u = (Math.abs(e) < 0.05 && Math.abs(v) < 0.05) ? 0 : (e > 0 ? cP.force : -cP.force); break;
                    case 'BangBang-Zone': u = Math.abs(e) > cP.zone ? (Math.sign(e) * cP.force) : (cP.kp * e - 20 * v + pP.k * target); break;
                    case 'Relay': if (e > cP.deadzone) u = cP.force; else if (e < -cP.deadzone) u = -cP.force; else u = alg.u_prev; break;
                    case 'TimeOptimal': {
                        const a_max = cP.force / pP.m; const sig = e - Math.sign(v) * (v * v) / (2 * a_max);
                        u = (Math.abs(e) < 0.2 && Math.abs(v) < 0.5) ? pP.k * target + 30 * e - 15 * v : (sig > 0 ? cP.force : -cP.force); break;
                    }
                    case 'FeedbackLin': u = pP.m * (cP.kp * e - cP.kd * v) + pP.c * v + pP.k * x; break;
                    case 'Backstepping': {
                        const z1_bs = -e; const z2_bs = v - (-cP.c1 * z1_bs);
                        u = pP.m * (-z1_bs - cP.c2 * z2_bs + cP.c1 * v) + pP.k * x + pP.c * v; break;
                    }
                    case 'DSC': {
                        const s1_dsc = x - target; const alpha1_dsc = -cP.c1 * s1_dsc;
                        alg.z_dsc += ((alpha1_dsc - alg.z_dsc) / cP.tau) * dt;
                        const z1_dot = (alpha1_dsc - alg.z_dsc) / cP.tau; const s2_dsc = v - alg.z_dsc;
                        u = pP.m * (z1_dot - cP.c2 * s2_dsc - s1_dsc) + pP.k * x + pP.c * v; break;
                    }
                    case 'TDC': {
                        const a_prev = (v - (alg.v_prev||0)) / dt; const F_tdc = a_prev - alg.u_prev / cP.m_nom;
                        u = cP.m_nom * (cP.kp * e - cP.kd * v - F_tdc); alg.v_prev = v; break;
                    }
                    case 'NDC': u = cP.kp * e - cP.kd * v - cP.k_nd * e * e * v; break;
                    case 'CFTC': {
                        const beta_cftc = 2 * cP.alpha / (1 + cP.alpha);
                        u = cP.kp * Math.pow(Math.abs(e), cP.alpha) * Math.sign(e) - cP.kd * Math.pow(Math.abs(v), beta_cftc) * Math.sign(v) + pP.k * target; break;
                    }

                    case 'SMC': { 
                        const s_smc = cP.c_surface * e - v;
                        const u_eq_smc = pP.k * x + pP.c * v - pP.m * cP.c_surface * v;
                        u = u_eq_smc + cP.k_gain * Math.max(-1, Math.min(1, s_smc / cP.eps)); break;
                    }
                    case 'VSC-RL': {
                        const s_rl = cP.c_surface * e - v;
                        const u_eq_rl = pP.k * x + pP.c * v - pP.m * cP.c_surface * v;
                        u = u_eq_rl + pP.m * (cP.eps * Math.sign(s_rl) + cP.k_rl * s_rl); break;
                    }
                    case 'ISMC': {
                        alg.integral += e * dt;
                        u = pP.k * x + pP.c * v + cP.k_gain * Math.max(-1, Math.min(1, (-v + cP.c1 * e + cP.c2 * alg.integral) / 0.1)); break;
                    }
                    case 'TSMC': {
                        const e_abs = Math.max(Math.abs(e), 0.001); const s_tsmc = -v + cP.beta * Math.sign(e) * Math.pow(e_abs, cP.alpha);
                        const u_eq_tsmc = pP.k * x + pP.c * v - pP.m * (cP.beta * cP.alpha * Math.pow(e_abs, cP.alpha - 1) * v);
                        u = u_eq_tsmc + cP.k_gain * Math.sign(s_tsmc); break;
                    }
                    case 'FTSMC': {
                        const s_ft = -v + cP.c1 * e + cP.c2 * Math.sign(e) * Math.pow(Math.abs(e), cP.q);
                        const u_eq_ft = pP.k * x + pP.c * v - pP.m * (cP.c1 * v + cP.c2 * cP.q * Math.pow(Math.max(Math.abs(e),0.001), cP.q-1) * v);
                        u = u_eq_ft + cP.k_gain * Math.sign(s_ft); break;
                    }
                    case 'ASMC': {
                        const s_asmc = cP.c_surface * e - v; alg.K_hat = Math.max(0, Math.min(alg.K_hat + cP.gamma * Math.abs(s_asmc) * dt, 200));
                        const u_eq_asmc = pP.k * x + pP.c * v - pP.m * cP.c_surface * v;
                        u = u_eq_asmc + alg.K_hat * Math.sign(s_asmc); break;
                    }
                    case 'SuperTwisting': {
                        const s_st = cP.c * e - v; alg.st_int += cP.W * Math.sign(s_st) * dt;
                        const u_eq_st = pP.k * x + pP.c * v - pP.m * cP.c * v;
                        u = u_eq_st + pP.m * (cP.lambda * Math.sqrt(Math.abs(s_st)) * Math.sign(s_st) + alg.st_int); break;
                    }
                    case 'LevantHOSM': {
                        const noisy_e = e + 0.1 * gaussNoise();
                        alg.z0_lev += (-cP.l1 * Math.sqrt(Math.abs(alg.z0_lev - noisy_e)) * Math.sign(alg.z0_lev - noisy_e) + alg.z1_lev) * dt;
                        alg.z1_lev += (-cP.l2 * Math.sign(alg.z0_lev - noisy_e)) * dt;
                        u = cP.k_gain * Math.max(-1, Math.min(1, (cP.c_surf * alg.z0_lev + alg.z1_lev) / 0.1)) + pP.k * target; break;
                    }
                    case 'VariableG-SMC': {
                        const s_vg = cP.c_surf * e - v; const k_vg = cP.k0 + cP.k1 * Math.abs(x);
                        u = pP.k*x + pP.c*v - pP.m*cP.c_surf*v + k_vg * Math.sign(s_vg); break;
                    }
                    case 'AW-PI': {
                        const u_pi_raw = cP.kp * e + cP.ki * alg.integral;
                        const u_sat = Math.max(-200, Math.min(200, u_pi_raw));
                        alg.integral += (e - cP.k_aw * (u_pi_raw - u_sat)) * dt;
                        u = u_sat - 20 * v + pP.k * target; break;
                    }

                    case 'NPID': {
                        alg.integral += fal(e, cP.alpha, cP.delta) * dt;
                        u = cP.kp * fal(e, cP.alpha, cP.delta) + cP.ki * alg.integral + cP.kd * fal(-v, cP.alpha, cP.delta); break;
                    }
                    case 'MRAC': {
                        const a_m = cP.wn * cP.wn * target - 2 * cP.zeta * cP.wn * alg.vm - cP.wn * cP.wn * alg.xm;
                        alg.vm += a_m * dt; alg.xm += alg.vm * dt; const e_m = alg.xm - x;
                        alg.theta_r = Math.max(-200, Math.min(200, alg.theta_r + cP.gamma * e_m * target * dt));
                        alg.theta_x = Math.max(-200, Math.min(200, alg.theta_x + cP.gamma * e_m * x * dt));
                        alg.theta_v = Math.max(-200, Math.min(200, alg.theta_v + cP.gamma * e_m * v * dt));
                        u = alg.theta_r * target + alg.theta_x * x + alg.theta_v * v; break;
                    }
                    case 'STR': {
                        const a_real = (v - (alg.v_prev||0)) / dt; const a_err = a_real - ((alg.u_prev - alg.k_hat*x - alg.c_hat*v)/pP.m);
                        alg.k_hat = Math.max(0.1, Math.min(20, alg.k_hat - cP.gamma * a_err * x * dt));
                        alg.c_hat = Math.max(0.1, Math.min(10, alg.c_hat - cP.gamma * a_err * v * dt));
                        u = pP.m * cP.wn * cP.wn * target - (pP.m * cP.wn * cP.wn - alg.k_hat) * x - (pP.m * 2 * cP.zeta * cP.wn - alg.c_hat) * v;
                        alg.v_prev = v; break;
                    }
                    case 'MFAC': {
                        const e_star = e - cP.kd * v; const y_star = x + cP.kd * v;
                        const d_u = alg.u_prev - alg.u_prev2; const d_y = alg.x_prev !== undefined ? (y_star - alg.x_prev) : 0; 
                        if (Math.abs(d_u) > 1e-5) alg.phi = alg.phi + (cP.eta * d_u / (cP.mu + d_u * d_u)) * (d_y - alg.phi * d_u);
                        if (alg.phi < 0.001 || alg.phi > 10.0) alg.phi = 0.5;
                        u = alg.u_prev + (cP.rho * alg.phi / (cP.lambda + alg.phi * alg.phi)) * e_star;
                        alg.u_prev2 = alg.u_prev; alg.x_prev = y_star; break;
                    }
                    case 'iPID': {
                        const F_raw = (v - (alg.v_prev||0)) / dt - cP.alpha * alg.u_prev;
                        alg.F_hat_f += ((F_raw - alg.F_hat_f) / cP.tau) * dt;
                        u = (-alg.F_hat_f + cP.kp * e - cP.kd * v) / cP.alpha; alg.v_prev = v; break;
                    }
                    case 'U-Model': {
                        const y_pred = x + v * dt + (alg.u_prev / pP.m) * dt * dt; const jacobian = (dt * dt) / pP.m; 
                        u = alg.u_prev + cP.step_nr * (target - y_pred) / jacobian + cP.kp * e - cP.kd * v; break;
                    }
                    case 'ESC': {
                        alg.u_esc_bias += -cP.k_esc * ((e * e) * Math.sin(cP.omega * stateRef.current.t)) * dt;
                        u = 20 * e - 10 * v + alg.u_esc_bias + cP.amp * Math.sin(cP.omega * stateRef.current.t); break;
                    }
                    case 'BELBIC': {
                        const SI = cP.w_e * e - cP.w_v * v; const Rew = e - 0.1 * v; 
                        const A_bel = Math.max(0, alg.V_belbic * SI); const O_bel = alg.W_belbic * SI;
                        alg.V_belbic = Math.max(0, alg.V_belbic + cP.a_A * SI * Math.max(0, Rew - A_bel) * dt); 
                        alg.W_belbic += cP.a_O * SI * (A_bel - O_bel - Rew) * dt; 
                        u = A_bel - O_bel + pP.k * target; break;
                    }
                    case 'Linear-Actor-Critic': {
                        const phi = [e, v, e*v]; // 特征向量
                        let V_val = 0, u_actor = 0;
                        for(let i=0; i<3; i++) { V_val += alg.w_critic[i]*phi[i]; u_actor += alg.w_actor[i]*phi[i]; }
                        
                        const r_reward = - (e*e + 0.1*v*v);
                        const e_next = target - (x + v*dt); const v_next = v + ((u_actor - pP.k*x - pP.c*v)/pP.m)*dt;
                        const phi_next = [e_next, v_next, e_next*v_next];
                        let V_next = 0; for(let i=0; i<3; i++) V_next += alg.w_critic[i]*phi_next[i];
                        
                        const td_err = r_reward + cP.gamma_rl * V_next - V_val;
                        
                        for(let i=0; i<3; i++) {
                            alg.w_critic[i] += cP.alpha_c * td_err * phi[i] * dt;
                            alg.w_actor[i] += cP.alpha_a * td_err * phi[i] * dt;
                        }
                        u = u_actor + pP.k * target; break;
                    }
                    case 'Gradient-PID': {
                        const grad_kp = -e * e; 
                        const grad_kd = e * v;  
                        alg.init_kp = Math.max(1, (alg.init_kp || cP.kp0) - cP.gamma_p * grad_kp * dt);
                        alg.init_kd = Math.max(0.1, (alg.init_kd || 10) - cP.gamma_d * grad_kd * dt);
                        u = alg.init_kp * e - alg.init_kd * v + pP.k*target; break;
                    }

                    case 'DOB': {
                        const a_est_dob = (v - (alg.v_prev || 0)) / dt;
                        const u_nom_dob = pP.m * a_est_dob + pP.c * v + pP.k * x;
                        alg.d_hat += ((alg.u_prev - u_nom_dob - alg.d_hat) / (1 / cP.w_c)) * dt;
                        u = cP.kp * e - cP.kd * v - alg.d_hat; alg.v_prev = v; break;
                    }
                    case 'IMC': {
                        const am_imc = (alg.u_prev - pP.k * alg.xm_imc - pP.c * alg.vm_imc) / pP.m;
                        alg.vm_imc += am_imc * dt; alg.xm_imc += alg.vm_imc * dt;
                        const r_mod = target - (x - alg.xm_imc); 
                        alg.integral = Math.max(-50, Math.min(50, alg.integral + (r_mod - x) * dt));
                        u = cP.kp * (r_mod - x) + cP.ki * alg.integral - cP.kd * v; break;
                    }
                    case 'ADRC': {
                        const eo = alg.z1 - x;
                        alg.z1 += (alg.z2 - 3 * cP.w_o * eo) * dt; alg.z2 += (alg.z3 - 3 * cP.w_o * cP.w_o * eo + cP.b0 * alg.u_prev) * dt; alg.z3 += (-Math.pow(cP.w_o, 3) * eo) * dt;
                        u = (cP.w_c * cP.w_c * (target - alg.z1) - 2 * cP.w_c * alg.z2 - alg.z3) / cP.b0; break;
                    }
                    case 'NL-ADRC': {
                        const e_eso = alg.z1 - x;
                        alg.z1 += (alg.z2 - 3 * cP.w_o * e_eso) * dt; 
                        alg.z2 += (alg.z3 - 3 * cP.w_o * cP.w_o * fal(e_eso, 0.5, cP.delta) + cP.b0 * alg.u_prev) * dt;
                        alg.z3 += (-Math.pow(cP.w_o, 3) * fal(e_eso, 0.25, cP.delta)) * dt;
                        u = (cP.w_c * cP.w_c * fal(target - alg.z1, 0.75, cP.delta) - 2 * cP.w_c * alg.z2 - alg.z3) / cP.b0; break;
                    }
                    case 'ARC': {
                        const s_arc = cP.c * e - v; 
                        alg.m_hat = Math.max(0.5, Math.min(10, alg.m_hat + cP.gamma * s_arc * (-cP.c * v) * dt));
                        u = alg.m_hat * (-cP.c * v) + pP.k * x + pP.c * v + cP.k_s * s_arc + cP.k_n * Math.sign(s_arc); break;
                    }
                    case 'ESO-SMC': {
                        const e_obs = alg.z1 - x;
                        alg.z1 += (alg.z2 - 3 * cP.w_o * e_obs) * dt; 
                        alg.z2 += (alg.z3 - 3 * cP.w_o * cP.w_o * e_obs + cP.b0 * alg.u_prev) * dt; 
                        alg.z3 += (-Math.pow(cP.w_o, 3) * e_obs) * dt;
                        const s_eso = cP.c_surface * (target - alg.z1) - alg.z2;
                        const u_eq_eso = (-cP.c_surface * alg.z2 - alg.z3) / cP.b0;
                        u = u_eq_eso + (cP.k_gain / cP.b0) * Math.max(-1, Math.min(1, s_eso / 0.1)); break;
                    }
                    case 'L1': {
                        alg.v_pred = alg.v_pred ?? v;
                        const v_pred_dot = -10.0 * (alg.v_pred - v) + alg.u_prev / pP.m + alg.theta_x;
                        alg.v_pred += v_pred_dot * dt;
                        const v_tilde = alg.v_pred - v;
                        alg.theta_x = Math.max(-5000, Math.min(5000, alg.theta_x - cP.gamma * v_tilde * dt));
                        const u_baseline = cP.wn * cP.wn * (target - x) - 2 * cP.zeta * cP.wn * v + pP.k * target;
                        const u_raw_l1 = u_baseline - alg.theta_x * pP.m;
                        alg.u_l1_filter += ((u_raw_l1 - alg.u_l1_filter) / cP.t_lpf) * dt;
                        u = alg.u_l1_filter; 
                        const a_m_l1 = cP.wn * cP.wn * target - 2 * cP.zeta * cP.wn * alg.vm - cP.wn * cP.wn * alg.xm;
                        alg.vm += a_m_l1 * dt; alg.xm += alg.vm * dt; break;
                    }
                    case 'I-and-I': {
                        const d_hat_ii = alg.theta_hat_ii - cP.lambda * pP.m * v;
                        const z_dot_ii = -cP.lambda * d_hat_ii + cP.lambda * alg.u_prev;
                        alg.theta_hat_ii += z_dot_ii * dt;
                        u = cP.kp * e - cP.kd * v + d_hat_ii; break;
                    }
                    case 'AdaptBackstepping': {
                        const z1_ab = -e; const alpha1_ab = -cP.c1 * z1_ab; const z2_ab = v - alpha1_ab;
                        alg.m_hat = Math.max(0.5, Math.min(10.0, alg.m_hat + cP.gamma_m * z2_ab * (cP.c1 * v) * dt));
                        u = pP.k * x + pP.c * v - z1_ab - cP.c2 * z2_ab - alg.m_hat * (cP.c1 * v); break;
                    }
                    case 'T-DOB': {
                        const td_step = Math.min(199, Math.floor(cP.delay_d));
                        const v_past = (alg.x_delay_buf[td_step-1] - alg.x_delay_buf[td_step]) / dt;
                        const a_past = (v - v_past) / (td_step * dt);
                        const d_tdob = alg.u_delay_buf[td_step] - cP.m_nom * a_past;
                        u = cP.kp * e - cP.kd * v - d_tdob; break;
                    }

                    case 'PPC': {
                        const rho_t = (cP.rho_0 - cP.rho_inf) * Math.exp(-cP.l * alg.t_target) + cP.rho_inf;
                        const safe_eps = Math.max(-0.99, Math.min(0.99, e / rho_t)); 
                        const z_ppc = 0.5 * Math.log((1 + safe_eps) / (1 - safe_eps));
                        u = cP.kp * z_ppc - cP.kd * v + pP.k * target; alg.ref_display = rho_t; break;
                    }
                    case 'BLF': {
                        const e_blf = Math.max(-cP.kb + 0.05, Math.min(cP.kb - 0.05, e)); 
                        u = cP.kp * (e_blf / (cP.kb * cP.kb - e_blf * e_blf)) - cP.kd * v + pP.k * target; break;
                    }
                    case 'ETC': {
                        if (Math.abs(e - alg.last_e_etc) > cP.sigma * Math.abs(e) + cP.eps0 || alg.t_target < dt) {
                           alg.last_u_etc = cP.kp * e - cP.kd * v + pP.k * target; alg.last_e_etc = e;
                        }
                        u = alg.last_u_etc; break;
                    }
                    case 'Switched': {
                        const V_lyap = 0.5 * e * e + 0.5 * v * v;
                        if (currTime - alg.last_switch_time > cP.dwell) { 
                            if (V_lyap > 1.0 && alg.switch_state !== 1) { alg.switch_state = 1; alg.last_switch_time = currTime; }
                            else if (V_lyap <= 1.0 && alg.switch_state !== 2) { alg.switch_state = 2; alg.last_switch_time = currTime; }
                        }
                        u = alg.switch_state === 1 ? (cP.p_fast * 20 * e - 5 * v + pP.k * target) : (cP.p_slow * 10 * e - 20 * v + pP.k * target); break;
                    }
                    case 'DynPole': {
                        const dyn_p = cP.p_min + (cP.p_max - cP.p_min) * Math.exp(-cP.alpha_p * Math.abs(e));
                        const k1_dp = pP.m * (dyn_p * dyn_p) - pP.k; const k2_dp = pP.m * (2 * dyn_p) - pP.c;
                        u = -k1_dp * x - k2_dp * v + (k1_dp + pP.k) * target; break;
                    }
                    case 'PTC': {
                        const t_eff = Math.max(cP.Tp - alg.t_target, cP.eps);
                        const u_cancel = pP.k * x + pP.c * v;
                        const u_ptc = pP.m * (cP.kp / (t_eff * t_eff) * e - cP.kd / t_eff * v);
                        u = u_cancel + u_ptc; break;
                    }
                    case 'FxTC': {
                        u = cP.k1 * Math.pow(Math.abs(e), cP.p_q)*Math.sign(e) + cP.k2 * Math.pow(Math.abs(e), cP.r_s)*Math.sign(e) - 20*v + pP.k*target; break;
                    }
                    case 'Tan-BLF': {
                        const tan_arg = (Math.PI * e * e) / (2 * cP.kb * cP.kb);
                        const safe_tan = Math.max(-1.5, Math.min(1.5, tan_arg));
                        u = cP.kp * e * (1 + Math.pow(Math.tan(safe_tan), 2)) - cP.kd * v + pP.k * target; break;
                    }
                    case 'TimeVary-BLF': {
                        const kb_t = (cP.kb0 - cP.kb_inf) * Math.exp(-cP.lb * alg.t_target) + cP.kb_inf;
                        const e_tvb = Math.max(-kb_t + 0.05, Math.min(kb_t - 0.05, e)); 
                        u = cP.kp * (e_tvb / (kb_t * kb_t - e_tvb * e_tvb)) - cP.kd * v + pP.k * target; alg.ref_display = kb_t; break;
                    }
                    case 'Integral-BLF': {
                        alg.integral += e * dt;
                        const i_blf = Math.max(-cP.kb_i + 0.01, Math.min(cP.kb_i - 0.01, alg.integral));
                        u = cP.kp * e + cP.ki * (i_blf / (cP.kb_i*cP.kb_i - i_blf*i_blf)) - cP.kd * v + pP.k*target; break;
                    }

                    case 'InputShaping': {
                        const { A1, A2, delay } = getInputShapingCoefficients(pP.m, pP.c, pP.k);
                        let r_shaped = 0;
                        for (let i = alg.target_history.length - 1; i >= 0; i--) {
                            const hist = alg.target_history[i];
                            if (currTime >= hist.t) r_shaped += A1 * hist.val;
                            if (currTime >= hist.t + delay) r_shaped += A2 * hist.val;
                            break; 
                        }
                        u = cP.kp * (r_shaped - x) - cP.kd * v + pP.k * r_shaped; alg.ref_display = r_shaped; break;
                    }
                    case 'ILC': {
                        if (alg.ilc_idx < 1000) {
                            alg.ilc_memory[alg.ilc_idx] += cP.gamma_ilc * e; 
                            u = alg.ilc_memory[alg.ilc_idx] + cP.kp_base * e + pP.k * target; alg.ilc_idx++;
                        } else { u = cP.kp_base * e + pP.k * target; } break;
                    }
                    case 'Repetitive': {
                        alg.rep_queue[alg.rep_idx] = e;
                        const e_delayed = alg.rep_queue[(alg.rep_idx + 1) % 50]; 
                        const u_rc = cP.q_filter * alg.u_prev + cP.k_rc * e_delayed;
                        u = u_rc + 20 * e - 10 * v + pP.k * target; alg.rep_idx = (alg.rep_idx + 1) % 50; break;
                    }
                    case 'GainSched': {
                        const alpha_gs = Math.max(0, Math.min(1, Math.abs(e) / cP.bnd)); 
                        const kp_curr = alpha_gs * cP.kp_far + (1 - alpha_gs) * cP.kp_near; 
                        u = kp_curr * e - 20 * v + pP.k * target; break;
                    }
                    case 'SmithPredict': {
                        const delay_idx = Math.min(199, Math.floor(cP.delay_t / dt));
                        const x_sim = alg.x_delay_buf[0] + (alg.u_prev/pP.m)*dt;
                        const x_sim_delay = alg.x_delay_buf[delay_idx];
                        u = cP.kp * (target - x - (x_sim - x_sim_delay)) - cP.kd * v + pP.k * target; break;
                    }
                    case 'Posicast': {
                        const td_p = Math.min(199, Math.floor(cP.td / dt));
                        const r_pos = target + cP.k_pos * (alg.target_history.length > td_p ? alg.target_history[alg.target_history.length-td_p].val : target);
                        u = cP.kp * (r_pos - x) - cP.kd * v + pP.k * r_pos; alg.ref_display = r_pos; break;
                    }
                    case 'FuzzyPID': {
                        alg.integral = Math.max(-50, Math.min(50, alg.integral + e * dt));
                        const e_norm = Math.max(-1, Math.min(1, e / 5));
                        const ec_norm = Math.max(-1, Math.min(1, -v / 5));
                        const mem_e = getMembership(e_norm);
                        const mem_ec = getMembership(ec_norm);
                        
                        let rule_P = 0, sum_W = 0;
                        const w_NN = Math.min(mem_e.N, mem_ec.N); rule_P += w_NN * 1; sum_W += w_NN;
                        const w_NZ = Math.min(mem_e.N, mem_ec.Z); rule_P += w_NZ * 1; sum_W += w_NZ;
                        const w_NP = Math.min(mem_e.N, mem_ec.P); rule_P += w_NP * 0; sum_W += w_NP;
                        const w_ZN = Math.min(mem_e.Z, mem_ec.N); rule_P += w_ZN * 1; sum_W += w_ZN;
                        const w_ZZ = Math.min(mem_e.Z, mem_ec.Z); rule_P += w_ZZ * 0; sum_W += w_ZZ;
                        const w_ZP = Math.min(mem_e.Z, mem_ec.P); rule_P += w_ZP * -1; sum_W += w_ZP;
                        const w_PN = Math.min(mem_e.P, mem_ec.N); rule_P += w_PN * 0; sum_W += w_PN;
                        const w_PZ = Math.min(mem_e.P, mem_ec.Z); rule_P += w_PZ * -1; sum_W += w_PZ;
                        const w_PP = Math.min(mem_e.P, mem_ec.P); rule_P += w_PP * -1; sum_W += w_PP;
                        
                        const defuzz_P = sum_W > 0 ? (rule_P / sum_W) : 0;
                        const dk_p = cP.range * Math.abs(defuzz_P);
                        
                        u = (cP.kp0 + dk_p) * e + cP.ki0 * alg.integral - cP.kd0 * v; break;
                    }
                    case 'NeuralPID': {
                        alg.integral = Math.max(-50, Math.min(50, alg.integral + e * dt));
                        alg.w1 = Math.max(0.001, alg.w1 + cP.eta * e * e * dt); alg.w2 = Math.max(0.001, alg.w2 + cP.eta * e * alg.integral * dt); alg.w3 = Math.max(0.001, alg.w3 + cP.eta * e * (-v) * dt);
                        const sumW = alg.w1 + alg.w2 + alg.w3;
                        u = cP.K * ((alg.w1/sumW) * e + (alg.w2/sumW) * alg.integral + (alg.w3/sumW) * (-v)); break;
                    }
                    case 'Fuzzy': {
                        const e_norm_f = Math.max(-1, Math.min(1, e * cP.ke));
                        const ec_norm_f = Math.max(-1, Math.min(1, -v * cP.kec));
                        const mf_e = getMembership(e_norm_f);
                        const mf_ec = getMembership(ec_norm_f);
                        
                        let rule_U = 0, sum_Wf = 0;
                        const evalRule = (w_e, w_ec, out_val) => {
                            const w = Math.min(w_e, w_ec);
                            rule_U += w * out_val; sum_Wf += w;
                        };
                        evalRule(mf_e.N, mf_ec.N, -1); evalRule(mf_e.N, mf_ec.Z, -1); evalRule(mf_e.N, mf_ec.P, 0);
                        evalRule(mf_e.Z, mf_ec.N, -1); evalRule(mf_e.Z, mf_ec.Z, 0);  evalRule(mf_e.Z, mf_ec.P, 1);
                        evalRule(mf_e.P, mf_ec.N, 0);  evalRule(mf_e.P, mf_ec.Z, 1);  evalRule(mf_e.P, mf_ec.P, 1);
                        
                        const defuzz_U = sum_Wf > 0 ? (rule_U / sum_Wf) : 0;
                        u = defuzz_U * cP.gain * 50; break;
                    }
                    case 'EnergyShaping': {
                        u = pP.k * x - cP.k_d * (x - target) - (cP.r_d0 + cP.r_d1 * Math.abs(v)) * v; break;
                    }

                    case 'TubeMPC': {
                        const x_mpc_star = x + v * cP.t_pred; 
                        const u_mpc_star = (target - x_mpc_star) / (cP.t_pred*cP.t_pred) + cP.lambda * target;
                        u = u_mpc_star + cP.k_anc * (x_mpc_star - x) - 20 * v; break;
                    }
                    case 'SDRE': {
                        alg.P_sdre = Math.max(0.1, alg.P_sdre - (alg.P_sdre * alg.P_sdre / cP.q_weight - e*e) * dt);
                        u = cP.q_weight * alg.P_sdre * e - 20 * v + pP.k * target; break;
                    }
                    case 'GPC': {
                        let gpc_sum = 0; for(let i=0; i<cP.ny; i++) gpc_sum += alg.e_hist[i] || 0;
                        u = alg.u_prev + (gpc_sum / (cP.nu + cP.lam)) - 10 * v; break;
                    }
                    case 'RLS-Adaptive': {
                        const y_curr = x;
                        const y_past = alg.x_delay_buf[2]; 
                        const u_past = alg.u_delay_buf[2];
                        const phi_rls = [y_past, u_past];
                        
                        const P_phi = [
                            alg.P_rls[0][0]*phi_rls[0] + alg.P_rls[0][1]*phi_rls[1],
                            alg.P_rls[1][0]*phi_rls[0] + alg.P_rls[1][1]*phi_rls[1]
                        ];
                        const den_rls = cP.rls_lambda + phi_rls[0]*P_phi[0] + phi_rls[1]*P_phi[1];
                        const K_rls = [P_phi[0]/den_rls, P_phi[1]/den_rls];
                        
                        const err_rls = y_curr - (alg.theta_rls[0]*phi_rls[0] + alg.theta_rls[1]*phi_rls[1]);
                        alg.theta_rls[0] += K_rls[0] * err_rls;
                        alg.theta_rls[1] += K_rls[1] * err_rls;
                        
                        const P_new = [[0,0],[0,0]];
                        for(let i=0; i<2; i++) {
                            for(let j=0; j<2; j++) {
                                P_new[i][j] = (alg.P_rls[i][j] - K_rls[i]*P_phi[j]) / cP.rls_lambda;
                            }
                        }
                        alg.P_rls = P_new;
                        
                        const b_est = Math.max(0.001, alg.theta_rls[1]);
                        u = (cP.w_bw * e - alg.theta_rls[0] * v) / b_est + pP.k*target; break;
                    }
                    case 'Robust-NL-Damping': {
                        const robust_d = cP.gamma_d * Math.abs(e) * v; 
                        u = cP.kp_nom * e - (20 + cP.gamma_d + Math.abs(robust_d)) * v + pP.k * target; break;
                    }
                    case 'NDOB': {
                        const p_ndob = cP.l_obs * pP.m * v;
                        alg.z1 += (-cP.l_obs * (alg.z1 + p_ndob) - cP.l_obs * (pP.k*x + pP.c*v - alg.u_prev)) * dt;
                        u = cP.kp * e - cP.kd * v - (alg.z1 + p_ndob) + pP.k*x + pP.c*v; break;
                    }

                    case 'Extended-Luenberger': {
                        alg.l_x += (alg.l_v + cP.l_gain*(x - alg.l_x)) * dt;
                        alg.l_v += (alg.u_prev/pP.m - pP.k/pP.m*alg.l_x - pP.c/pP.m*alg.l_v + cP.l_gain*(x - alg.l_x)) * dt;
                        u = cP.kp * (target - alg.l_x) - cP.kd * alg.l_v + pP.k*target; break;
                    }
                    case 'EKF-Ctrl': {
                        const x_ekf = x + 0.05 * gaussNoise();
                        alg.l_x += (alg.l_v + (cP.q_cov/cP.r_cov)*(x_ekf - alg.l_x)) * dt;
                        alg.l_v += (alg.u_prev/pP.m - pP.k/pP.m*alg.l_x + (cP.q_cov/cP.r_cov)*(x_ekf - alg.l_x)) * dt;
                        u = cP.kp * (target - alg.l_x) - cP.kd * alg.l_v + pP.k*target; break;
                    }
                    case 'Particle-Filter': {
                        for(let i=0; i<cP.p_num; i++) alg.pf_particles[i] = alg.pf_particles[i] + 0.1*gaussNoise() + (x - alg.pf_particles[i])*0.5;
                        const x_pf = alg.pf_particles.reduce((a,b)=>a+b) / cP.p_num;
                        u = cP.kp * (target - x_pf) - cP.kd * v + pP.k*target; break;
                    }
                    case 'Neural-RBF-ADRC': {
                        const e_eso_rbf = alg.z1 - x;
                        alg.z1 += (alg.z2 - 3 * cP.wo * e_eso_rbf) * dt;
                        alg.z2 += (alg.z3 - 3 * cP.wo*cP.wo * e_eso_rbf + cP.b0 * alg.u_prev) * dt;
                        alg.z3 += (-Math.pow(cP.wo, 3) * e_eso_rbf) * dt;
                        
                        const centers = [-2, -1, 0, 1, 2];
                        let h_rbf = centers.map(c_pt => Math.exp(-Math.pow(x - target - c_pt, 2) / 2));
                        let f_nn = 0;
                        for(let i=0; i<5; i++) f_nn += alg.w_rbf[i] * h_rbf[i];
                        
                        for(let i=0; i<5; i++) alg.w_rbf[i] += cP.n_lr * e_eso_rbf * h_rbf[i] * dt;
                        
                        u = (cP.wc*cP.wc*(target - alg.z1) - 2*cP.wc*alg.z2 - alg.z3 - f_nn) / cP.b0; break;
                    }
                    case 'Artstein-Reduction': {
                        const d_a = Math.min(199, Math.floor(cP.delay_a));
                        let integral_u = 0;
                        for (let j = 0; j < d_a; j++) {
                            integral_u += Math.exp(-0.1 * j * DT) * (alg.u_delay_buf[j] || 0) * DT;
                        }
                        const z_art = x + integral_u; 
                        u = cP.kp * (target - z_art) - cP.kd * v + pP.k*target; break;
                    }
                    case 'Quantized-Ctrl': {
                        const u_qc_raw = cP.kp * e - cP.kd * v + pP.k*target;
                        u = Math.round(u_qc_raw / cP.q_step) * cP.q_step; break;
                    }
                    case 'Event-Triggered-MPC': {
                        const x_pred_et = x + v * cP.t_pred;
                        if (Math.abs(x - (alg.x_prev||x)) > cP.et_limit || currTime < dt*2) {
                            alg.u_hold = (target - x_pred_et)/(cP.t_pred*cP.t_pred) + cP.lambda*target - 20*v;
                            alg.x_prev = x;
                        }
                        u = alg.u_hold; break;
                    }

                    case 'FO-PD': {
                        const wi_pd = calcGLWeights(cP.mu, 50); let dE_pd = 0;
                        for(let j=0; j<50; j++) dE_pd += wi_pd[j] * (alg.e_hist[j]||0);
                        u = cP.kp * e + cP.kd * (dE_pd / Math.pow(dt, cP.mu)) + pP.k*target; break;
                    }
                    case 'Nonlinear-Power-ADRC': {
                        const fe = alg.z1 - x;
                        alg.z1 += (alg.z2 - cP.wo * Math.pow(Math.abs(fe), cP.alpha)*Math.sign(fe)) * dt;
                        alg.z2 += (alg.u_prev - cP.wo*cP.wo * Math.pow(Math.abs(fe), cP.alpha)*Math.sign(fe)) * dt;
                        u = (cP.wc*cP.wc*(target - alg.z1) - 2*cP.wc*v - alg.z2) / cP.b0; break;
                    }
                    case 'Implicit-Euler-Ctrl': {
                        const s_ie = 5.0 * e - v;
                        u = pP.k*x + pP.c*v - pP.m*5.0*v + (s_ie / (1 + cP.lambda * dt)) * 50.0; break;
                    }
                    case 'Lorenz-Coupled': {
                        alg.l_x_l += (10 * (alg.l_y_l - alg.l_x_l)) * dt;
                        alg.l_y_l += (alg.l_x_l * (cP.rho - alg.l_z_l) - alg.l_y_l) * dt;
                        alg.l_z_l += (alg.l_x_l * alg.l_y_l - (8/3) * alg.l_z_l) * dt;
                        u = cP.kp * (0.1 * alg.l_x_l - e) - cP.kd * v + pP.k * x; 
                        alg.ref_display = target - 0.1 * alg.l_x_l; break;
                    }
                    case 'Speed-Gradient': {
                        alg.integral += -cP.gamma_sg * (-v) * dt;
                        u = cP.q_weight * alg.integral - 10*v + pP.k*target; break;
                    }
                    case 'Feedback-Passivation': {
                        u = pP.k*x + pP.c*v - cP.kp*x + cP.kp*target - cP.kv*v; break;
                    }

                    default: u = 0;
                }
                
                const MAX_FORCE = loopStateRef.current.actuatorLimit;
                u = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, u));
                alg.u_prev = u;
                return u;
            };

            const updatePhysics = () => {
                const state = stateRef.current;
                const { physParams: pP, ctrlParams: cP, method: currMethod, targetMode, contDisturbance, sensorNoise, coulombFriction, actuatorDeadzone, plantDelay } = loopStateRef.current;
                
                const activeTarget = getTargetSignal(targetMode, pP.target, state.t);

                const nx = sensorNoise > 0 ? sensorNoise * gaussNoise() : 0;
                const nv = sensorNoise > 0 ? (sensorNoise * 2.0) * gaussNoise() : 0;

                const uCommand = calculateControlOutput(DT, state.x + nx, state.v + nv, activeTarget, pP, cP, state.alg, currMethod, state.t);
                
                state.alg.rmse_sum = (state.alg.rmse_sum || 0) + Math.pow(activeTarget - state.x, 2);
                state.alg.ticks = (state.alg.ticks || 0) + 1;

                state.alg.u_hw_buffer.unshift(uCommand);
                if (state.alg.u_hw_buffer.length > 100) state.alg.u_hw_buffer.pop();
                
                const uDelayed = getDelayedCommand(state.alg.u_hw_buffer, plantDelay);
                const uActual = applyActuatorDeadzone(uDelayed, actuatorDeadzone);
                state.alg.energy = (state.alg.energy || 0) + Math.pow(uActual, 2) * DT;

                let ext_f = contDisturbance;
                if (impulseRef.current > 0) {
                    ext_f += impulseRef.current; 
                    impulseRef.current *= 0.8; 
                    if (impulseRef.current < 1.0) impulseRef.current = 0;
                }

                let friction_force = 0;
                if (coulombFriction > 0) {
                    if (Math.abs(state.v) > 0.01) {
                        friction_force = -coulombFriction * Math.sign(state.v);
                    } else {
                        const driving_f = uActual + ext_f - (pP.k * state.x);
                        if (Math.abs(driving_f) < coulombFriction) {
                            friction_force = -driving_f; 
                        } else {
                            friction_force = -coulombFriction * Math.sign(driving_f);
                        }
                    }
                }

                const f_net = uActual + ext_f + friction_force - (pP.k * state.x) - (pP.c * state.v);
                const a = f_net / pP.m;
                
                state.v += a * DT;
                state.x += state.v * DT;
                state.t += DT;

                if (targetMode === 'step' && hasSettled(state.x, state.v, activeTarget)) {
                    chartStateRef.current.freezeTimer += DT;
                } else {
                    chartStateRef.current.freezeTimer = 0;
                    chartStateRef.current.frozen = false; 
                }

                if (chartStateRef.current.freezeTimer > 2.0 && impulseRef.current === 0) {
                    chartStateRef.current.frozen = true;
                }
                
                if (!chartStateRef.current.frozen) {
                    historyRef.current.push({ 
                        t: state.t,
                        x: state.x,
                        uCmd: uCommand,
                        uActual,
                        target: activeTarget,
                        ref: getReferenceValue(state.alg)
                    });
                    if (historyRef.current.length > 2500) {
                        chartStateRef.current.frozen = true;
                    }
                }
            };

            const animate = () => {
                if (loopStateRef.current.running) updatePhysics();
                drawSimulation();
                drawCharts();
                requestRef.current = requestAnimationFrame(animate);
            };

            useEffect(() => {
                resetAlgState(method, physParams.target);
                requestRef.current = requestAnimationFrame(animate);
                return () => cancelAnimationFrame(requestRef.current);
            }, []);

            const drawSimulation = () => {
                const canvas = simCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width, h = canvas.height;
                
                ctx.clearRect(0, 0, w, h);
                const mapX = (val) => (val + 2) / 14 * w; 
                const groundY = h - 50;
                
                // 绘制背景网格线 (护眼浅色适配)
                ctx.beginPath(); ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'; ctx.lineWidth = 1;
                for (let i = 0; i <= 14; i++) {
                    const px = (i / 14) * w;
                    ctx.moveTo(px, 0); ctx.lineTo(px, groundY);
                }
                for (let i = 0; i <= 5; i++) {
                    const py = (i / 5) * groundY;
                    ctx.moveTo(0, py); ctx.lineTo(w, py);
                }
                ctx.stroke();

                // 绘制地平线
                ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY);
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
                for (let i = 0; i <= 10; i+=1) {
                    const px = mapX(i);
                    ctx.fillRect(px, groundY, 2, 5); ctx.fillText(i, px - 3, groundY + 18);
                }

                const activeTarget = getTargetSignal(loopStateRef.current.targetMode, loopStateRef.current.physParams.target, stateRef.current.t);
                const targetX = mapX(activeTarget);
                
                // 目标线 (柔绿)
                ctx.beginPath(); ctx.setLineDash([6, 4]); ctx.moveTo(targetX, 20); ctx.lineTo(targetX, groundY);
                ctx.strokeStyle = '#10B981'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
                
                ctx.fillStyle = '#10B981'; 
                ctx.beginPath(); ctx.moveTo(targetX, groundY); ctx.lineTo(targetX - 6, groundY - 8); ctx.lineTo(targetX + 6, groundY - 8); ctx.fill();
                ctx.fillText(uiStateRef.current.text.targetMarker, targetX - 18, 15);

                const blockX = mapX(stateRef.current.x);
                const boxSize = 40;
                
                // 绘制方块 (柔蓝/柔红)
                ctx.shadowColor = impulseRef.current > 10 ? 'rgba(244,63,94,0.3)' : 'rgba(59,130,246,0.3)'; 
                ctx.shadowBlur = 15; ctx.shadowOffsetY = 4;
                ctx.fillStyle = impulseRef.current > 10 ? '#ef4444' : '#3b82f6';
                ctx.fillRect(blockX - boxSize/2, groundY - boxSize, boxSize, boxSize);
                ctx.shadowColor = 'transparent';
                
                // 绘制弹簧
                ctx.beginPath(); ctx.moveTo(0, groundY - boxSize/2);
                const segments = 24, step = blockX / segments;
                for (let i = 1; i <= segments; i++) {
                    ctx.lineTo(step * i, groundY - boxSize/2 + (i % 2 === 0 ? 6 : -6));
                }
                ctx.lineTo(blockX - boxSize/2, groundY - boxSize/2);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();

                ctx.fillStyle = 'white'; ctx.font = 'bold 11px sans-serif'; 
                ctx.fillText(stateRef.current.x.toFixed(2) + 'm', blockX - 16, groundY - boxSize/2 + 4);
            };

            const drawCharts = () => {
                const posCanvas = posChartCanvasRef.current;
                const ctrlCanvas = ctrlChartCanvasRef.current;
                if (!posCanvas || !ctrlCanvas) return;
                
                const posCtx = posCanvas.getContext('2d');
                const ctrlCtx = ctrlCanvas.getContext('2d');
                
                const w = posCanvas.width;
                const hPos = posCanvas.height;
                const hCtrl = ctrlCanvas.height;
                
                posCtx.clearRect(0, 0, w, hPos);
                ctrlCtx.clearRect(0, 0, w, hCtrl);
                
                // 中心线 (护眼浅色适配)
                posCtx.strokeStyle = '#e2e8f0'; posCtx.lineWidth = 1; posCtx.beginPath(); posCtx.moveTo(0, hPos/2); posCtx.lineTo(w, hPos/2); posCtx.stroke();
                ctrlCtx.strokeStyle = '#e2e8f0'; ctrlCtx.lineWidth = 1; ctrlCtx.beginPath(); ctrlCtx.moveTo(0, hCtrl/2); ctrlCtx.lineTo(w, hCtrl/2); ctrlCtx.stroke();

                if (historyRef.current.length < 2) return;

                const t_start = historyRef.current[0].t;
                const t_end = historyRef.current[historyRef.current.length - 1].t;
                const t_span = Math.max(6.0, t_end - t_start); 

                const plotLine = (ctx, h, dataKey, color, offset, scale, isDash = false, lineWidth = 2) => {
                    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
                    if (isDash) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
                    historyRef.current.forEach((pt, i) => {
                        const x = ((pt.t - t_start) / t_span) * w;
                        const y = (h/2) - (pt[dataKey] - offset) * scale;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    });
                    ctx.stroke(); ctx.setLineDash([]);
                };

                const POS_OFFSET = 5; 
                const POS_SCALE = 12;
                
                plotLine(posCtx, hPos, 'target', '#10B981', POS_OFFSET, POS_SCALE, false, 1.5);
                plotLine(posCtx, hPos, 'x', '#3b82f6', POS_OFFSET, POS_SCALE, false, 2.5);
                
                if (shouldShowReference(loopStateRef.current.method)) {
                    plotLine(posCtx, hPos, 'ref', '#8b5cf6', POS_OFFSET, POS_SCALE, true, 1.5); 
                }
                
                if(loopStateRef.current.method === 'PPC') {
                    posCtx.beginPath(); posCtx.strokeStyle = '#e879f9'; posCtx.lineWidth = 1; posCtx.setLineDash([3, 3]);
                    historyRef.current.forEach((pt, i) => {
                        const x = ((pt.t - t_start) / t_span) * w;
                        const y_up = (hPos/2) - (pt.target + pt.ref - POS_OFFSET) * POS_SCALE;
                        if (i === 0) posCtx.moveTo(x, y_up); else posCtx.lineTo(x, y_up);
                    });
                    posCtx.stroke();
                    posCtx.beginPath();
                    historyRef.current.forEach((pt, i) => {
                        const x = ((pt.t - t_start) / t_span) * w;
                        const y_dn = (hPos/2) - (pt.target - pt.ref - POS_OFFSET) * POS_SCALE;
                        if (i === 0) posCtx.moveTo(x, y_dn); else posCtx.lineTo(x, y_dn);
                    });
                    posCtx.stroke(); posCtx.setLineDash([]);
                }

                const CTRL_OFFSET = 0;
                const CTRL_SCALE = 0.35;
                
                plotLine(ctrlCtx, hCtrl, 'uActual', '#ef4444', CTRL_OFFSET, CTRL_SCALE, false, 2);

                if (chartStateRef.current.frozen) {
                    posCtx.fillStyle = '#64748b'; posCtx.font = 'bold 12px sans-serif';
                    posCtx.fillText(uiStateRef.current.text.recorded, w - 85, 25);
                    ctrlCtx.fillStyle = '#64748b'; ctrlCtx.font = 'bold 12px sans-serif';
                    ctrlCtx.fillText(uiStateRef.current.text.recorded, w - 85, 25);
                }

                // 性能指标绘制 (护眼色适配)
                posCtx.fillStyle = '#0f766e'; posCtx.font = 'bold 13px monospace';
                const rmse = stateRef.current.alg.ticks ? Math.sqrt(stateRef.current.alg.rmse_sum / stateRef.current.alg.ticks).toFixed(3) : '0.000';
                posCtx.fillText(`${uiStateRef.current.text.rmse}: ${rmse}`, 15, 25);
                
                ctrlCtx.fillStyle = '#be123c'; ctrlCtx.font = 'bold 13px monospace';
                const energy = stateRef.current.alg.energy ? stateRef.current.alg.energy.toFixed(1) : '0.0';
                ctrlCtx.fillText(`${uiStateRef.current.text.energy}: ${energy} J`, 15, 25);
            };

            const handleMethodChange = (e) => {
                const newMethod = e.target.value;
                setMethod(newMethod);
                setCtrlParams(getDefaultParams(newMethod));
                resetSim(newMethod, physParams.target);
            };

            const resetSim = (m = method, target = physParams.target, initX = initialX) => {
                stateRef.current = { x: initX, v: 0, t: 0, alg: {} };
                resetAlgState(m, target);
                historyRef.current = [];
                chartStateRef.current = { frozen: false, freezeTimer: 0 };
                impulseRef.current = 0;
                setRunning(true);
            };

            const handleParamChange = (key, val, isPhys = false) => {
                if (isPhys) setPhysParams(prev => ({...prev, [key]: parseFloat(val)}));
                else setCtrlParams(prev => ({...prev, [key]: parseFloat(val)}));
                historyRef.current = [];
                chartStateRef.current = { frozen: false, freezeTimer: 0 };
            };

            const groupedMethods = Object.entries(CONTROLLER_CONFIGS).reduce((acc, [key, conf]) => {
                (acc[conf.category] = acc[conf.category] || []).push({ key, ...conf });
                return acc;
            }, {});
            const sortedCategories = Object.keys(groupedMethods).sort();
            const getCategoryLabel = (category) => {
                const categoryId = category.slice(0, 2);
                return CATEGORY_LABELS[language][categoryId] || category.substring(4);
            };

            return (
                <div className="flex flex-col h-screen text-slate-700 font-sans overflow-hidden selection:bg-teal-200">
                {/* Header: 浅色/护眼玻璃拟物 */}
                <header className="bg-[#C7EDCC]/90 backdrop-blur-lg border-b border-white/60 px-6 py-4 flex items-center justify-between z-20 shrink-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-2.5 rounded-xl text-white shadow-sm">
                            <ActivityIcon size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-teal-900 tracking-tight drop-shadow-sm">{t.appTitle}</h1>
                            <p className="text-xs text-teal-700/80 font-medium tracking-wide">{t.appSubtitle}</p>
                            <p className="mt-1 max-w-[520px] text-[11px] font-medium leading-relaxed text-teal-800/85">{t.appSlogan}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <select value={method} onChange={handleMethodChange} className="bg-white/80 border border-teal-300/50 text-teal-800 text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-400 block p-2.5 font-bold max-w-[280px] shadow-sm cursor-pointer transition-shadow hover:shadow-md">
                            {sortedCategories.map(category => (
                            <optgroup key={category} label={`[ ${getCategoryLabel(category)} ]`} className="font-bold text-slate-500 bg-white">
                                {groupedMethods[category].map(m => (
                                <option key={m.key} value={m.key} className="text-slate-800">{m.name}</option>
                                ))}
                            </optgroup>
                            ))}
                        </select>
                        
                        <button onClick={() => setRunning(!running)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95 ${running ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200' : 'bg-teal-500 text-white hover:bg-teal-600 border border-teal-400/50 shadow-sm'}`}>
                            {running ? <PauseIcon size={18}/> : <PlayIcon size={18}/>}
                            {running ? t.pause : t.start}
                        </button>

                        <button onClick={triggerDisturbance} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-bold shadow-sm transition-all active:scale-95 border border-rose-400/50">
                            <ZapIcon size={18}/> {t.disturb}
                        </button>

                        <button onClick={() => resetSim()} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-bold transition-all active:scale-95 border border-slate-300">
                            <RefreshCwIcon size={18}/> {t.reset}
                        </button>
                    </div>
                </header>

                {/* 围绕式三栏主布局 */}
                <div className="flex flex-1 flex-col overflow-hidden p-4 gap-4">
                    <div className="glass-panel flex flex-col items-center justify-center rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 via-white/80 to-teal-50/90 px-4 py-4 text-center shadow-sm">
                        <p className="max-w-4xl text-sm font-semibold leading-relaxed text-emerald-900">{t.communityBanner}</p>
                        <a
                            href={REPOSITORY_URL}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t.communityCta}
                            title={t.communityCta}
                            className="mt-3 inline-flex flex-col items-center justify-center rounded-2xl border border-emerald-300 bg-white/90 px-5 py-3 text-emerald-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-white hover:shadow-md"
                        >
                            <GitHubIcon size={36} />
                            <span className="mt-2 text-sm font-extrabold">{t.communityCta}</span>
                            <span className="mt-1 text-xs font-medium text-emerald-700/80">{t.communityButtonHint}</span>
                        </a>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                            <a
                                href={STAR_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-emerald-300 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-emerald-800 transition-all hover:border-emerald-500 hover:bg-white"
                            >
                                {t.starRepo}
                            </a>
                            <a
                                href={FORK_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-emerald-300 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-emerald-800 transition-all hover:border-emerald-500 hover:bg-white"
                            >
                                {t.forkRepo}
                            </a>
                            <a
                                href={ISSUES_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-emerald-300 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-emerald-800 transition-all hover:border-emerald-500 hover:bg-white"
                            >
                                {t.openIssues}
                            </a>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
                    {/* 左侧栏: 控制器参数与架构解析 */}
                    <div className="w-[340px] flex flex-col gap-4 overflow-y-auto tech-scroll shrink-0 pb-10">
                        {/* 算法解说区 */}
                        <div className="glass-panel rounded-xl p-5 flex flex-col gap-4 shrink-0">
                            <div>
                                <h3 className="text-lg font-extrabold text-teal-700 mb-2 flex items-center gap-2"><InfoIcon size={20}/> {CONTROLLER_CONFIGS[method].name}</h3>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed text-justify">{CONTROLLER_CONFIGS[method].desc}</p>
                            </div>
                            
                            <div className="p-3.5 bg-white/60 rounded-lg border border-teal-200 shadow-inner">
                                <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest block mb-2">{t.governingEquation}</span>
                                <div className="font-mono text-[13px] text-teal-900 math-font whitespace-pre-wrap leading-relaxed">
                                    {CONTROLLER_CONFIGS[method].eq}
                                </div>
                            </div>
                            
                            <div className="p-3.5 bg-amber-50/80 rounded-lg border border-amber-200">
                                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block mb-2 flex items-center gap-1">💡 {t.tuningGuide}</span>
                                <div className="text-xs font-medium text-amber-900 leading-relaxed text-justify">
                                    {CONTROLLER_CONFIGS[method].tuning}
                                </div>
                            </div>
                        </div>

                        {/* 核心算法参数调节 */}
                        <div className="glass-panel rounded-xl p-5 shrink-0">
                            <h3 className="text-xs font-extrabold text-teal-700 uppercase tracking-widest mb-6 border-l-2 border-teal-500 pl-2">{t.controlGainMatrix}</h3>
                            <div className="space-y-5">
                                {Object.keys(ctrlParams).map(key => {
                                    const [, min, max, step] = CONTROLLER_CONFIGS[method].params[key];
                                    return (
                                    <div key={key} className="group">
                                        <div className="flex justify-between mb-2 items-end">
                                            <label className="text-xs font-bold text-slate-500 group-hover:text-teal-600 transition-colors">{key.toUpperCase()}</label>
                                            <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{ctrlParams[key].toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min={min} max={max} step={step} value={ctrlParams[key]} 
                                            onChange={(e) => handleParamChange(key, e.target.value, false)}
                                            className="w-full accent-teal-500"
                                        />
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>

                    {/* 中间主视窗: 动画与波形图 */}
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        {/* 物理仿真视窗 */}
                        <div className="glass-panel rounded-xl p-2 flex flex-col relative overflow-hidden group shrink-0">
                            <div className="px-4 py-2 flex justify-between items-center mb-1">
                                <span className="font-bold text-teal-700 flex items-center gap-2 tracking-wide"><SettingsIcon size={16}/> {t.plantDynamics}</span>
                                <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-200 math-font">
                                    {"m·ẍ + c·ẋ + k·x = u(t-τ) + d(t) - F_{fric}"}
                                </span>
                            </div>
                            <div className="relative h-[220px] w-full bg-[#FDFBF7] rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                                <canvas ref={simCanvasRef} width={900} height={220} className="w-full h-full block" />
                            </div>
                            {impulseRef.current > 10 && <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse rounded-xl mix-blend-screen"></div>}
                        </div>

                        {/* 波形视窗 */}
                        <div className="glass-panel rounded-xl p-2 flex-1 flex flex-col gap-2 overflow-hidden">
                            <div className="px-4 py-1.5 flex justify-between items-center shrink-0">
                                <span className="font-bold text-teal-700 tracking-wide">{t.timeSeriesObserver}</span>
                            </div>
                            
                            <div className="flex flex-row flex-1 gap-3 overflow-hidden px-2 pb-2">
                                <div className="relative w-1/2 h-full bg-[#FDFBF7] rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-inner">
                                    <div className="absolute top-2 left-3 text-[10px] text-slate-600 font-bold z-10 bg-white/80 backdrop-blur px-2 py-1 rounded border border-slate-200">{t.positionPlot}</div>
                                    <canvas ref={posChartCanvasRef} width={600} height={300} className="w-full h-full object-fill block" />
                                </div>

                                <div className="relative w-1/2 h-full bg-[#FDFBF7] rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-inner">
                                     <div className="absolute top-2 left-3 text-[10px] text-slate-600 font-bold z-10 bg-white/80 backdrop-blur px-2 py-1 rounded border border-slate-200">{t.controlInputPlot}</div>
                                    <canvas ref={ctrlChartCanvasRef} width={600} height={300} className="w-full h-full object-fill block" />
                                </div>
                            </div>

                            <div className="flex justify-center gap-8 py-1.5 text-xs font-bold text-slate-600 shrink-0 bg-white/60 rounded-lg mx-2 mb-1 border border-slate-200">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#3b82f6] rounded-[4px] shadow-sm"></span> {t.actualPosition}</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#10B981] rounded-[4px] shadow-sm"></span> {t.targetCommand}</span>
                                {shouldShowReference(method) && 
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-[#8b5cf6] border-dashed rounded-[4px]"></span> {t.auxiliaryReference}</span>
                                }
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#ef4444] rounded-[4px] shadow-sm"></span> {t.actuatorOutput}</span>
                            </div>
                        </div>
                    </div>

                    {/* 右侧栏: 物理对象与环境边界 */}
                    <div className="w-[340px] flex flex-col gap-4 overflow-y-auto tech-scroll shrink-0 pb-10">
                        <div className="glass-panel rounded-xl p-5">
                            <h3 className="text-xs font-extrabold text-sky-600 uppercase tracking-widest mb-5 flex items-center gap-2 border-l-2 border-sky-600 pl-2">🌐 {t.languageSection}</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500">{t.languageLabel}</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setLanguage('zh')}
                                            className={`rounded-lg border px-3 py-2 text-sm font-bold transition-all ${language === 'zh' ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'}`}
                                        >
                                            {t.chinese}
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`rounded-lg border px-3 py-2 text-sm font-bold transition-all ${language === 'en' ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'}`}
                                        >
                                            {t.english}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs font-medium leading-relaxed text-slate-500">{t.languageHint}</p>
                            </div>
                        </div>
                        
                        {/* 目标轨迹与外部环境 */}
                        <div className="glass-panel rounded-xl p-5">
                            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-5 flex items-center gap-2 border-l-2 border-blue-600 pl-2">🎯 {t.environmentSection}</h3>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500">{t.targetMode}</label>
                                    </div>
                                    <select 
                                        value={targetMode} 
                                        onChange={(e) => { setTargetMode(e.target.value); resetSim(); }}
                                        className="w-full bg-white border border-blue-200 text-blue-700 font-bold text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="step">{t.step}</option>
                                        <option value="sine">{t.sine}</option>
                                        <option value="square">{t.square}</option>
                                    </select>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-blue-600">{t.targetX}</label>
                                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{physParams['target']}m</span>
                                    </div>
                                    <input type="range" min="0" max="10" step="0.5" value={physParams['target']} onChange={(e) => handleParamChange('target', e.target.value, true)} className="w-full accent-blue-500"/>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-blue-600">{t.initX}</label>
                                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{initialX}m</span>
                                    </div>
                                    <input type="range" min="-10" max="10" step="0.5" value={initialX} onChange={(e) => { const val = parseFloat(e.target.value); setInitialX(val); resetSim(method, physParams.target, val); }} className="w-full accent-blue-500"/>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-orange-600">{t.constDist}</label>
                                        <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">{contDisturbance}N</span>
                                    </div>
                                    <input type="range" min="-50" max="50" step="1" value={contDisturbance} onChange={(e) => { setContDisturbance(parseFloat(e.target.value)); chartStateRef.current.frozen = false; chartStateRef.current.freezeTimer = 0; }} className="w-full accent-orange-500"/>
                                </div>
                            </div>
                        </div>

                        {/* 硬件非理想限制 */}
                        <div className="glass-panel rounded-xl p-5 border-rose-200/50">
                            <h3 className="text-xs font-extrabold text-rose-600 uppercase tracking-widest mb-5 flex items-center gap-2 border-l-2 border-rose-600 pl-2">🔧 {t.hardwareSection}</h3>
                            <div className="space-y-5">
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-purple-600">{t.saturation}</label>
                                        <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">±{actuatorLimit}N</span>
                                    </div>
                                    <input type="range" min="10" max="500" step="10" value={actuatorLimit} onChange={(e) => { setActuatorLimit(parseFloat(e.target.value)); chartStateRef.current.frozen = false; chartStateRef.current.freezeTimer = 0; }} className="w-full accent-purple-500"/>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-rose-600">{t.deadzone}</label>
                                        <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">±{actuatorDeadzone}N</span>
                                    </div>
                                    <input type="range" min="0" max="50" step="1" value={actuatorDeadzone} onChange={(e) => { setActuatorDeadzone(parseFloat(e.target.value)); chartStateRef.current.frozen = false; chartStateRef.current.freezeTimer = 0; }} className="w-full accent-rose-500"/>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">{t.delay}</label>
                                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{(plantDelay * 0.02).toFixed(2)}s</span>
                                    </div>
                                    <input type="range" min="0" max="50" step="1" value={plantDelay} onChange={(e) => { setPlantDelay(parseFloat(e.target.value)); chartStateRef.current.frozen = false; chartStateRef.current.freezeTimer = 0; }} className="w-full accent-indigo-500"/>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-amber-600">{t.coulomb}</label>
                                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{coulombFriction}N</span>
                                    </div>
                                    <input type="range" min="0" max="20" step="1" value={coulombFriction} onChange={(e) => { setCoulombFriction(parseFloat(e.target.value)); chartStateRef.current.frozen = false; chartStateRef.current.freezeTimer = 0; }} className="w-full accent-amber-500"/>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-teal-600">{t.noise}</label>
                                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{sensorNoise.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="0.5" step="0.01" value={sensorNoise} onChange={(e) => { setSensorNoise(parseFloat(e.target.value)); chartStateRef.current.frozen = false; chartStateRef.current.freezeTimer = 0; }} className="w-full accent-teal-400"/>
                                </div>
                            </div>
                        </div>

                        {/* 被控物理对象 */}
                        <div className="glass-panel rounded-xl p-5 border-emerald-200/50 mb-6">
                            <h3 className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-5 flex items-center gap-2 border-l-2 border-emerald-600 pl-2">📦 {t.plantSection}</h3>
                            <div className="space-y-5">
                                {plantParameterLabels.map(p => (
                                <div key={p.key} className="group">
                                    <div className="flex justify-between mb-2 items-end">
                                        <label className="text-xs font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">{p.name}</label>
                                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{physParams[p.key]}{p.unit}</span>
                                    </div>
                                    <input 
                                        type="range" min={p.min} max={p.max} step={p.step} value={physParams[p.key]} 
                                        onChange={(e) => handleParamChange(p.key, e.target.value, true)}
                                        className="w-full accent-emerald-500"
                                    />
                                </div>
                                ))}
                            </div>
                        </div>

                    </div>
                    </div>
                </div>
                </div>
            );
        }
