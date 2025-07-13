/**
 * A utility class to manage undo/redo state history
 */
export class UndoRedo<T> {
  private states: T[];
  private currentIndex: number;
  private maxStates: number;

  constructor(maxStates = 20) {
    this.states = [];
    this.currentIndex = -1;
    this.maxStates = maxStates;
  }

  /**
   * Push a new state to the history
   */
  push(state: T): void {
    // If we're not at the end, remove all states after current
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Add the new state
    this.states.push(JSON.parse(JSON.stringify(state)));
    this.currentIndex = this.states.length - 1;

    // Enforce maximum number of states
    if (this.states.length > this.maxStates) {
      this.states.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo to the previous state
   */
  undo(): T | null {
    if (!this.canUndo()) return null;
    
    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
  }

  /**
   * Redo to the next state
   */
  redo(): T | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.states = [];
    this.currentIndex = -1;
  }

  /**
   * Get the current state
   */
  getCurrentState(): T | null {
    if (this.currentIndex < 0) return null;
    return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
  }

  /**
   * Replace all states with a single state and set it as current
   */
  reset(state: T): void {
    this.states = [JSON.parse(JSON.stringify(state))];
    this.currentIndex = 0;
  }
}