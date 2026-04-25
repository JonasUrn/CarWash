# Simulation Logic — Flowchart

M/M/1 queue: single server, Poisson arrivals (exponential interarrival), exponential service times.
Simulation time unit = real second (factor=1.0 in SimPy RealtimeEnvironment).

```mermaid
flowchart TD
  A([Start SimPy RealtimeEnvironment]) --> B[Sample interarrival time\nexp mean = 3600 / ARRIVAL_RATE_PER_HOUR]
  B --> C[/Car arrives/]
  C --> D{Server free?}

  D -->|Yes| E[Acquire resource\nqueue_size stays 0]
  D -->|No| F[Increment queue_size\nwait for resource]
  F --> G[Resource granted\ndecrement queue_size\nrecord wait time]
  G --> E

  E --> H[Sample service duration\nexp mean = MEAN_SVC_SEC\nset is_serving = True]
  H --> I[Yield env.timeout duration]
  I --> J[Record service time\nincrement cars_served\nis_serving = False]
  J --> K{Another car waiting?}
  K -->|Yes — SimPy auto-assigns| E
  K -->|No| L[Server idle]
  L --> B

  C --> B
```

## Key Parameters

| Env var | Default | Meaning |
|---|---|---|
| `MEAN_IAT_SEC` | `7` | Mean interarrival time (seconds) |
| `MEAN_SVC_SEC` | `5` | Mean service time (seconds) |

With defaults: utilization ρ = 5/7 ≈ **71%**
