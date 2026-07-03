import { mount } from 'svelte';
import './lib/tokens/index.css';
import Dev from './Dev.svelte';

mount(Dev, { target: document.getElementById('app')! });
