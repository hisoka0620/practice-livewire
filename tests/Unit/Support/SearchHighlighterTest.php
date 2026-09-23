<?php

use App\Support\SearchHighlighter;

it('escapes text when the search is empty', function (): void {
  $highlighted = (new SearchHighlighter)->highlight('<b>Task</b>', '　');

  expect($highlighted)->toBe('&lt;b&gt;Task&lt;/b&gt;');
});

it('highlights multiple words separated by half-width and full-width spaces', function (): void {
  $highlighted = (new SearchHighlighter)->highlight('Write docs and test code', 'docs　test');

  expect($highlighted)
    ->toContain('<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">docs</mark>')
    ->toContain('<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">test</mark>');
});

it('escapes text before highlighting it', function (): void {
  $highlighted = (new SearchHighlighter)->highlight('<script>alert(1)</script>', 'script');

  expect($highlighted)
    ->toBe('&lt;<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">script</mark>&gt;alert(1)&lt;/<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">script</mark>&gt;');
});
