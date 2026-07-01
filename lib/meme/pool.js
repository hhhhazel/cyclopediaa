export function pickMemePoolItem(pool, history, historyLimit) {
    const recentIds = history.map(function (entry) {
      return entry.id;
    });
    let candidates = pool.filter(function (item) {
      return !recentIds.includes(item.id);
    });
  
    if (!candidates.length) {
      candidates = pool.filter(function (item) {
        return item.id !== recentIds[recentIds.length - 1];
      });
    }
  
    if (!candidates.length) {
      candidates = pool.slice();
    }
  
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    history.push({ id: pick.id });
  
    if (history.length > historyLimit) {
      history.shift();
    }
  
    return pick;
  }
  
  export function pickWeightedMemePoolItem(weightItems, history, historyLimit) {
    const recentIds = history.map(function (entry) {
      return entry.id;
    });
    const items = weightItems.map(function (entry) {
      let weight = entry.weight;
  
      if (recentIds.includes(entry.id)) {
        weight *= 0.35;
      }
  
      return { id: entry.id, weight: weight };
    });
    const total = items.reduce(function (sum, item) {
      return sum + item.weight;
    }, 0);
    let roll = Math.random() * total;
    let pickedId = items[items.length - 1].id;
  
    for (let i = 0; i < items.length; i++) {
      if (roll < items[i].weight) {
        pickedId = items[i].id;
        break;
      }
  
      roll -= items[i].weight;
    }
  
    history.push({ id: pickedId });
  
    if (history.length > historyLimit) {
      history.shift();
    }
  
    return pickedId;
  }
  