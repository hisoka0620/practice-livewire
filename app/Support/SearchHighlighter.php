<?php

namespace App\Support;

final class SearchHighlighter
{
    public function highlight(?string $text, string $search): string
    {
        if (blank(mb_convert_kana($search, 's'))) {
            return e($text);
        }

        $words = preg_split('/[\s　]+/u', trim($search), -1, PREG_SPLIT_NO_EMPTY);

        $escapedText = e($text);

        $keyword = implode('|', array_map(
            fn(string $word): string => preg_quote($word, '/'),
            $words,
        ));

        return preg_replace(
            '/' . $keyword . '/iu',
            '<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">$0</mark>',
            $escapedText,
        ) ?? $escapedText;
    }
}
