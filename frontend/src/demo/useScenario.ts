import { useCallback, useEffect, useRef, useState } from 'react';
import { SCENARIOS, type ScenarioApi } from './scenarios';

export interface ScenarioState {
  /** Index into SCENARIOS, or undefined when none is running. */
  scenario?: number;
  step: number;
  playing: boolean;
  finished: boolean;
}

const IDLE: ScenarioState = { step: 0, playing: false, finished: false };
const TICK = 100;
const sleep = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

/**
 * Plays a scripted scenario by calling the app's own actions step by step. Replayable from the start,
 * pausable, and a step can be skipped. Starting another scenario, or stopping, cancels the one running.
 */
export function useScenario(api: ScenarioApi) {
  const [state, setState] = useState<ScenarioState>(IDLE);
  const apiRef = useRef(api);
  apiRef.current = api;
  const run = useRef(0);
  const playing = useRef(false);
  const skip = useRef(false);

  const play = useCallback(async (scenario: number) => {
    const token = ++run.current;
    playing.current = true;
    skip.current = false;
    setState({ scenario, step: 0, playing: true, finished: false });
    const steps = SCENARIOS[scenario].steps;
    for (let index = 0; index < steps.length; index++) {
      if (token !== run.current) return;
      setState(previous => ({ ...previous, step: index }));
      await steps[index].run?.(apiRef.current);
      let waited = 0;
      while (waited < steps[index].dwell) {
        if (token !== run.current) return;
        if (skip.current) break;
        await sleep(TICK);
        if (playing.current) waited += TICK;
      }
      skip.current = false;
    }
    if (token === run.current) setState(previous => ({ ...previous, playing: false, finished: true }));
  }, []);

  const stop = useCallback(() => {
    run.current++;
    playing.current = false;
    setState(IDLE);
    apiRef.current.setMock(null);
  }, []);

  useEffect(() => () => { run.current++; }, []);

  return {
    state,
    start: (scenario: number) => void play(scenario),
    replay: () => state.scenario !== undefined && void play(state.scenario),
    stop,
    toggle: () => {
      playing.current = !playing.current;
      setState(previous => ({ ...previous, playing: playing.current }));
    },
    next: () => { skip.current = true; },
  };
}
