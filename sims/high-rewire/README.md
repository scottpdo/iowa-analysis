# Base model

- Locations of voters and candidates randomly sampled from within unit circle
- Number of connections sampled from [3, 3, 4, 5, 6] (possible it could be greater than this)
- High degree of rewiring (25% of all of an agent's connections) 
- First round vote samples all candidates, weighted by square of inverse distance from candidate to voter:

```js
candidate = utils.sample(
  candidates,
  candidates.map((c) => {
    const id = Math.max(1 - utils.distance(c, voter), 0.0001);
    return id ** 2;
  })
);
```

- On subsequent rounds, voters whose candidate is below threshold choose a new candidate, sampled from their connections
