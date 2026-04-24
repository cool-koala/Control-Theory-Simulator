const fal = (e, a, d) => Math.abs(e) <= d ? e / Math.pow(d, 1 - a) : Math.sign(e) * Math.pow(Math.abs(e), a);
        const gaussNoise = () => {
            let u = 0, v = 0;
            while(u === 0) u = Math.random();
            while(v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };
        const calcGLWeights = (order, len) => {
            let w = [1];
            for (let j = 1; j < len; j++) w[j] = (1 - (order + 1)/j) * w[j-1];
            return w;
        };

        // 简化的隶属度计算函数 (Fuzzy 重构用)
        const getMembership = (x) => {
            let N = 0, Z = 0, P = 0;
            if (x <= -1) N = 1; else if (x > -1 && x < 0) { N = -x; Z = x + 1; }
            else if (x >= 0 && x < 1) { Z = 1 - x; P = x; } else P = 1;
            return { N, Z, P };
        };

export { fal, gaussNoise, calcGLWeights, getMembership };
