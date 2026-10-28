<?php

namespace FlatRate\ForumNavigation\Tests;

use Flarum\Discussion\Discussion;
use Flarum\Search\Database\DatabaseSearchState;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use FlatRate\ForumNavigation\Api\F2PresentationFields;
use FlatRate\ForumNavigation\QuickRailGate;
use FlatRate\ForumNavigation\Search\Filter\F2MainPinsFilter;
use FlatRate\ForumNavigation\Search\Filter\F2ExcludeMainPinsFilter;
use FlatRate\ForumNavigation\Search\Filter\MainPinsFilter;
use Illuminate\Database\Capsule\Manager;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use Tobyz\JsonApiServer\Context;

final class F2PresentationTest extends TestCase
{
    public function testOnlyAllowlistedPresentationSettingsReachTheForum(): void
    {
        $settings = $this->createMock(SettingsRepositoryInterface::class);
        $values = [
            MainPinsFilter::SETTING_PUBLIC => '[1,2,1]',
            MainPinsFilter::SETTING_MEMBER => '[3]',
            QuickRailGate::SETTING_V2_ADMIN_VISIBLE => '0',
            QuickRailGate::SETTING_V2_USER_VISIBLE => '0',
        ];
        $settings->method('get')->willReturnCallback(function ($key) use ($values) {
            $this->assertArrayHasKey($key, $values, 'Never expose arbitrary settings');
            return $values[$key];
        });
        $context = (new ReflectionClass(Context::class))->newInstanceWithoutConstructor();
        $payload = [];
        foreach ((new F2PresentationFields($settings))() as $field) {
            $payload[$field->name] = $field->getValue($context);
        }
        $this->assertSame([1, 2], $payload['flatratePublicMainPinnedDiscussionIds']);
        $this->assertSame([3], $payload['flatrateMemberMainPinnedDiscussionIds']);
        $this->assertFalse($payload['flatrateCenterMenuV2AdminVisible']);
        $this->assertFalse($payload['flatrateCenterMenuV2UserVisible']);
        $this->assertSame(3, count($payload['flatrateForumNavigationManifest']['groups']));
        $this->assertCount(9, $payload);
    }

    public function testF2PinFiltersNeverBroadenTheAlreadyVisibleQuery(): void
    {
        $db = new Manager();
        $db->addConnection(['driver' => 'sqlite', 'database' => ':memory:']);
        $db->setAsGlobal();
        $db->bootEloquent();
        $db->schema()->create('discussions', function ($table) {
            $table->integer('id');
            $table->boolean('is_private');
        });
        $db->table('discussions')->insert([
            ['id' => 1, 'is_private' => false],
            ['id' => 2, 'is_private' => true],
            ['id' => 3, 'is_private' => false],
        ]);
        $settings = $this->createMock(SettingsRepositoryInterface::class);
        $settings->method('get')->willReturn('[1,2]');
        foreach ([
            [F2MainPinsFilter::class, 'public', false, [1]],
            [F2MainPinsFilter::class, 'member', false, [1]],
            [F2MainPinsFilter::class, 'public', true, [3]],
            [F2MainPinsFilter::class, ['invalid'], false, []],
            [F2ExcludeMainPinsFilter::class, 'member', false, [3]],
            [F2ExcludeMainPinsFilter::class, 'member', true, [1]],
            [F2ExcludeMainPinsFilter::class, 'public', false, []],
        ] as [$class, $value, $negate, $expected]) {
            $state = new DatabaseSearchState(new User(), false);
            $state->setQuery(Discussion::query()->where('is_private', false));
            (new $class($settings))->filter($state, $value, $negate);
            $this->assertSame($expected, $state->getQuery()->orderBy('id')->pluck('id')->all());
        }
        $db->getConnection()->disconnect();
    }
}
