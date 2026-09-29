#!/usr/bin/env php
<?php declare(strict_types=1);

const EXPECTED_PACKAGE = 'league/flysystem';
const EXPECTED_ADVISORIES = [
    'PKSA-w9tt-7782-78jx' => 'Required transitively by supported Flarum 1.8.x; allow dependency resolution in CI while keeping the advisory visible to audit.',
    'PKSA-pwh8-d4fr-nywn' => 'Required transitively by supported Flarum 1.8.x; allow dependency resolution in CI while keeping the advisory visible to audit.',
];

function fail(string $message): never
{
    fwrite(STDERR, "COMPOSER_SECURITY_POLICY=FAIL {$message}\n");
    exit(1);
}

/** @return array<string, mixed> */
function readJsonFile(string $path): array
{
    if (!is_file($path)) {
        fail("missing_json path={$path}");
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        fail("invalid_json path={$path}");
    }

    return $decoded;
}

/** @param array<string, mixed> $data */
function writeJsonFile(string $path, array $data): void
{
    $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if (!is_string($encoded)) {
        fail("encode_failed path={$path}");
    }

    if (file_put_contents($path, $encoded . PHP_EOL) === false) {
        fail("write_failed path={$path}");
    }
}

/** @return array<string, array{on-block: bool, on-audit: bool, reason: string}> */
function expectedIgnoreId(): array
{
    $result = [];
    foreach (EXPECTED_ADVISORIES as $id => $reason) {
        $result[$id] = [
            'on-block' => true,
            'on-audit' => false,
            'reason' => $reason,
        ];
    }

    return $result;
}

/** @param array<string, mixed> $root */
function policyFromRoot(array $root): array
{
    $config = $root['config'] ?? [];
    if (!is_array($config)) {
        fail('config_not_object');
    }

    if (($config['policy'] ?? null) === false) {
        fail('global_policy_disabled');
    }

    $policy = $config['policy'] ?? [];
    if (!is_array($policy)) {
        fail('policy_not_object');
    }

    $advisories = $policy['advisories'] ?? [];
    if ($advisories === false || !is_array($advisories)) {
        fail('advisories_policy_disabled_or_invalid');
    }

    return $advisories;
}

/** @param array<string, mixed> $root */
function verifyPolicy(array $root): void
{
    $advisories = policyFromRoot($root);

    if (($advisories['block'] ?? true) !== true) {
        fail('advisory_blocking_not_enabled');
    }

    if (($advisories['audit'] ?? 'fail') !== 'fail') {
        fail('advisory_audit_not_fail');
    }

    foreach (['ignore', 'ignore-severity'] as $broadKey) {
        if (isset($advisories[$broadKey]) && $advisories[$broadKey] !== []) {
            fail("broad_exception_present key={$broadKey}");
        }
    }

    $ignoreId = $advisories['ignore-id'] ?? [];
    if (!is_array($ignoreId)) {
        fail('ignore_id_not_object');
    }

    if ($ignoreId !== expectedIgnoreId()) {
        fail('ignore_id_not_exact_expected_set');
    }

    echo "COMPOSER_SECURITY_COMPAT_MODE=EXACT_ID_BLOCKING_EXCEPTION\n";
    echo "COMPOSER_POLICY_ADVISORIES_BLOCK=true\n";
    echo "COMPOSER_POLICY_ADVISORIES_AUDIT=fail\n";
    foreach (array_keys(EXPECTED_ADVISORIES) as $id) {
        echo "ACCEPTED_ADVISORY_ID={$id}\n";
    }
    echo "ACCEPTED_ON_BLOCK=true\n";
    echo "ACCEPTED_ON_AUDIT=false\n";
    echo "GLOBAL_SECURITY_BLOCKING_DISABLED=false\n";
    echo "PACKAGE_WIDE_IGNORE=false\n";
}

/** @param array<string, mixed> $root */
function applyPolicy(array $root): array
{
    policyFromRoot($root);

    $config = $root['config'] ?? [];
    if (!is_array($config)) {
        fail('config_not_object');
    }
    $policy = $config['policy'] ?? [];
    if (!is_array($policy)) {
        $policy = [];
    }
    $advisories = $policy['advisories'] ?? [];
    if (!is_array($advisories)) {
        $advisories = [];
    }

    if (($advisories['block'] ?? true) !== true) {
        fail('preexisting_advisory_blocking_disabled');
    }
    foreach (['ignore', 'ignore-severity'] as $broadKey) {
        if (isset($advisories[$broadKey]) && $advisories[$broadKey] !== []) {
            fail("preexisting_broad_exception key={$broadKey}");
        }
    }
    $existingIgnoreId = $advisories['ignore-id'] ?? [];
    if (!is_array($existingIgnoreId)) {
        fail('preexisting_ignore_id_invalid');
    }
    $unexpected = array_diff(array_keys($existingIgnoreId), array_keys(EXPECTED_ADVISORIES));
    if ($unexpected !== []) {
        fail('preexisting_unexpected_ignore_id=' . implode(',', $unexpected));
    }

    $advisories['block'] = true;
    $advisories['audit'] = 'fail';
    $advisories['ignore-id'] = expectedIgnoreId();
    $policy['advisories'] = $advisories;
    $config['policy'] = $policy;
    $root['config'] = $config;

    return $root;
}

/** @param array<string, mixed> $audit */
function assertAudit(array $audit): void
{
    $advisories = $audit['advisories'] ?? null;
    if (!is_array($advisories)) {
        fail('audit_missing_advisories_object');
    }

    $found = [];
    foreach ($advisories as $package => $packageAdvisories) {
        if ($package !== EXPECTED_PACKAGE) {
            fail("unexpected_advisory_package={$package}");
        }
        if (!is_array($packageAdvisories)) {
            fail("invalid_advisory_list package={$package}");
        }

        foreach ($packageAdvisories as $advisory) {
            if (!is_array($advisory)) {
                fail("invalid_advisory package={$package}");
            }
            $id = $advisory['advisoryId'] ?? null;
            $packageName = $advisory['packageName'] ?? $package;
            if (!is_string($id) || !is_string($packageName)) {
                fail("invalid_advisory_identity package={$package}");
            }
            if ($packageName !== EXPECTED_PACKAGE) {
                fail("unexpected_advisory_package_name={$packageName}");
            }
            $found[] = $id;
        }
    }

    sort($found);
    $expected = array_keys(EXPECTED_ADVISORIES);
    sort($expected);
    if ($found !== $expected) {
        fail('audit_advisory_set_mismatch expected=' . implode(',', $expected) . ' got=' . implode(',', $found));
    }

    foreach (['ignored-advisories', 'abandoned', 'filter', 'unreachable-repositories'] as $key) {
        if (isset($audit[$key]) && $audit[$key] !== []) {
            fail("unexpected_audit_finding key={$key}");
        }
    }

    echo "ACCEPTED_ADVISORY_PACKAGE=" . EXPECTED_PACKAGE . "\n";
    foreach ($expected as $id) {
        echo "AUDIT_VISIBLE_ADVISORY_ID={$id}\n";
    }
    echo "KNOWN_ADVISORY_COUNT=" . count($expected) . "\n";
    echo "UNKNOWN_ADVISORY_COUNT=0\n";
    echo "SECURITY_AUDIT_GATE=PASS_ACCEPTED_KNOWN_DEBT\n";
}

$command = $argv[1] ?? '';
$path = $argv[2] ?? '';

switch ($command) {
    case 'apply':
        if ($path === '') {
            fail('usage_apply_requires_composer_json');
        }
        $root = applyPolicy(readJsonFile($path));
        writeJsonFile($path, $root);
        verifyPolicy(readJsonFile($path));
        break;

    case 'verify':
        if ($path === '') {
            fail('usage_verify_requires_composer_json');
        }
        verifyPolicy(readJsonFile($path));
        break;

    case 'assert-audit':
        if ($path === '') {
            fail('usage_assert_audit_requires_json');
        }
        assertAudit(readJsonFile($path));
        break;

    default:
        fail('usage: ci-composer-advisory-policy.php apply|verify|assert-audit <json-file>');
}
