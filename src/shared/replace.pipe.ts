import { Pipe, PipeTransform } from '@angular/core';

/**
 * ReplacePipe — replaces all occurrences of `from` with `to` in a string.
 * Usage: {{ 'scale_up' | replace:'_':' ' }}   →  'scale up'
 *
 * Standalone pipe — import directly into standalone components
 * OR add to the declarations[] + exports[] of a SharedModule.
 */
@Pipe({
  name: 'replace',
  standalone: true,
  pure: true,
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, from: string, to: string): string {
    if (value == null) return '';
    return value.split(from).join(to);
  }
}