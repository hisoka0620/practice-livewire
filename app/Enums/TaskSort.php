<?php

namespace App\Enums;

enum TaskSort: string
{
    case None = '';
    case Asc = 'asc';
    case Desc = 'desc';

    public function next(): self
    {
        return match ($this) {
            self::None => self::Asc,
            self::Asc => self::Desc,
            self::Desc => self::None,
        };
    }
}
