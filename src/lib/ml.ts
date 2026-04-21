import * as tf from '@tensorflow/tfjs';

export const FI_NAMES = ['CGPA', 'Attendance', 'Assignments', 'Backlogs', 'Semester', 'Study Hrs', 'Screen Time', 'Sleep', 'Participation', 'Stress'];
export const FI_COLORS = ['var(--purple)', 'var(--accent)', 'var(--teal)', 'var(--danger)', 'var(--avg)', 'var(--good)', '#E07B39', '#6366F1', '#0891B2', '#9333EA'];

export function generateDataset(n = 800) {
  const X: number[][] = [];
  const Y: number[] = [];
  const rng = (a: number, b: number) => a + (b - a) * Math.random();
  for (let i = 0; i < n; i++) {
    const roll = Math.random();
    let cgpa, att, assign, bl, sem, study, screen, sleep, part, stress, cat;
    if (roll < 0.33) {
      cat = 0;
      cgpa = rng(2, 6.2);
      att = rng(30, 76);
      assign = rng(20, 65);
      bl = Math.floor(rng(1, 8));
      sem = Math.floor(rng(1, 8));
      study = rng(0, 2.5);
      screen = rng(4, 10);
      sleep = rng(3, 6);
      part = 1;
      stress = rng(6, 10);
    } else if (roll < 0.66) {
      cat = 1;
      cgpa = rng(5.5, 7.8);
      att = rng(65, 88);
      assign = rng(50, 80);
      bl = Math.floor(rng(0, 3));
      sem = Math.floor(rng(1, 8));
      study = rng(1.5, 4);
      screen = rng(2, 6);
      sleep = rng(5, 7);
      part = 2;
      stress = rng(4, 7);
    } else {
      cat = 2;
      cgpa = rng(7.5, 10);
      att = rng(82, 100);
      assign = rng(72, 100);
      bl = 0;
      sem = Math.floor(rng(1, 8));
      study = rng(3, 8);
      screen = rng(0, 3);
      sleep = rng(6, 9);
      part = 3;
      stress = rng(1, 5);
    }
    cgpa = Math.max(0, Math.min(10, cgpa + rng(-0.3, 0.3)));
    att = Math.max(0, Math.min(100, att + rng(-5, 5)));
    X.push([cgpa / 10, att / 100, assign / 100, Math.min(bl, 10) / 10, sem / 8, Math.min(study, 12) / 12, Math.min(screen, 12) / 12, Math.min(sleep, 10) / 10, part / 3, stress / 10]);
    Y.push(cat);
  }
  return { X, Y };
}

export async function buildAndTrainNN(X: number[][], Y: number[], progressCb?: (ep: number, total: number, logs?: tf.Logs) => void) {
  const xs = tf.tensor2d(X);
  const ys = tf.oneHot(tf.tensor1d(Y, 'int32'), 3);
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [10], units: 48, activation: 'relu', kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }) }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.15 }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({ optimizer: tf.train.adam(0.007), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  const EPOCHS = 60;
  await model.fit(xs, ys, {
    epochs: EPOCHS,
    batchSize: 32,
    validationSplit: 0.15,
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch: number, logs?: tf.Logs) => {
        if (progressCb) progressCb(epoch + 1, EPOCHS, logs);
      }
    }
  });
  xs.dispose();
  ys.dispose();
  return model;
}

export async function nnPredict(model: tf.LayersModel, x: number[]) {
  const input = tf.tensor2d([x]);
  const prediction = model.predict(input) as tf.Tensor;
  const data = await prediction.data();
  input.dispose();
  prediction.dispose();
  return Array.from(data);
}

export function makeRandomForest(X: number[][], Y: number[], nTrees = 20) {
  const trees = [];
  for (let t = 0; t < nTrees; t++) {
    const idxs = Array.from({ length: X.length }, () => Math.floor(Math.random() * X.length));
    const bX = idxs.map(i => X[i]);
    const bY = idxs.map(i => Y[i]);
    const nF = X[0].length;
    const fi: number[] = [];
    while (fi.length < 4) {
      const f = Math.floor(Math.random() * nF);
      if (!fi.includes(f)) fi.push(f);
    }
    let bestF = fi[0], bestT = 0.5, bestGini = 1;
    for (const f of fi) {
      const vals = [...new Set(bX.map(r => parseFloat(r[f].toFixed(3))))].sort((a, b) => a - b);
      for (let v = 0; v < vals.length - 1; v++) {
        const thresh = (vals[v] + vals[v + 1]) / 2;
        const left = bY.filter((_, i) => bX[i][f] <= thresh);
        const right = bY.filter((_, i) => bX[i][f] > thresh);
        if (!left.length || !right.length) continue;
        const gini = (l: number[], n: number) => {
          const c = [0, 1, 2].map(cat => l.filter(x => x === cat).length / n);
          return 1 - c.reduce((s, p) => s + p * p, 0);
        };
        const g = left.length / bY.length * gini(left, left.length) + right.length / bY.length * gini(right, right.length);
        if (g < bestGini) {
          bestGini = g;
          bestF = f;
          bestT = thresh;
        }
      }
    }
    const l = bY.filter((_, i) => bX[i][bestF] <= bestT);
    const r = bY.filter((_, i) => bX[i][bestF] > bestT);
    const majority = (arr: number[]) => {
      const c = [0, 0, 0];
      arr.forEach(v => c[v]++);
      return c.indexOf(Math.max(...c));
    };
    trees.push({ feat: bestF, thresh: bestT, leftClass: majority(l.length ? l : [0]), rightClass: majority(r.length ? r : [2]) });
  }
  return trees;
}

export function rfPredict(trees: any[], x: number[]) {
  const votes = [0, 0, 0];
  trees.forEach(t => votes[x[t.feat] <= t.thresh ? t.leftClass : t.rightClass]++);
  const total = votes.reduce((a, b) => a + b, 0);
  return votes.map(v => v / total);
}

export function rfFeatureImportance(trees: any[]) {
  const nF = 10, imp = Array(nF).fill(0);
  trees.forEach(t => imp[t.feat]++);
  const total = imp.reduce((a, b) => a + b, 0) || 1;
  return imp.map(v => v / total);
}

function softmax(arr: number[]) {
  const mx = Math.max(...arr);
  const e = arr.map(v => Math.exp(v - mx));
  const s = e.reduce((a, b) => a + b, 0) || 1;
  return e.map(v => v / s);
}

export function trainLR(X: number[][], Y: number[], lr = 0.05, epochs = 300) {
  const nF = X[0].length, nC = 3;
  const W = Array.from({ length: nC }, () => Array(nF).fill(0).map(() => (Math.random() - 0.5) * 0.1));
  const b = Array(nC).fill(0);
  for (let ep = 0; ep < epochs; ep++) {
    const dW = Array.from({ length: nC }, () => Array(nF).fill(0));
    const db = Array(nC).fill(0);
    for (let i = 0; i < X.length; i++) {
      const logits = W.map((w, c) => w.reduce((s, wi, j) => s + wi * X[i][j], 0) + b[c]);
      const probs = softmax(logits);
      for (let c = 0; c < nC; c++) {
        const err = probs[c] - (Y[i] === c ? 1 : 0);
        for (let j = 0; j < nF; j++) dW[c][j] += err * X[i][j];
        db[c] += err;
      }
    }
    for (let c = 0; c < nC; c++) {
      for (let j = 0; j < nF; j++) W[c][j] -= lr * dW[c][j] / X.length;
      b[c] -= lr * db[c] / X.length;
    }
  }
  return { W, b };
}

export function lrPredict(model: { W: number[][], b: number[] }, x: number[]) {
  const logits = model.W.map((w, c) => w.reduce((s, wi, j) => s + wi * x[j], 0) + model.b[c]);
  return softmax(logits);
}
