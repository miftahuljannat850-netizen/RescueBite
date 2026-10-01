<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE donations MODIFY status VARCHAR(30) NOT NULL DEFAULT 'available'");
        } elseif (DB::getDriverName() === 'sqlite') {
            Schema::table('donations', function (Blueprint $table): void {
                $table->string('status', 30)->default('available')->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE donations MODIFY status ENUM('available', 'requested', 'collected', 'expired') NOT NULL DEFAULT 'available'");
        } elseif (DB::getDriverName() === 'sqlite') {
            Schema::table('donations', function (Blueprint $table): void {
                $table->enum('status', ['available', 'requested', 'collected', 'expired'])
                    ->default('available')
                    ->change();
            });
        }
    }
};
