#!/usr/bin/env php
<?php declare(strict_types=1);

$root = dirname(__DIR__);
$helper = $root . '/scripts/ci-composer-advisory-policy.php';
$fixtureDir = $root . '/tests/fixtures/ci-composer-advisory-policy';

$cases = [
    'CASE_1' => [
        'file' => 'case-1-active-w9tt.json',
        'exit' => 0,
        'stdout' => [
            'BLOCKING_ALLOWLIST_COUNT=2',
            'ACTIVE_AUDIT_ADVISORY_COUNT=1',
            'ACTIVE_AUDIT_ADVISORY_ID=PKSA-w9tt-7782-78jx',
            'INACTIVE_APPROVED_ADVISORY_COUNT=1',
            'INACTIVE_APPROVED_ADVISORY_ID=PKSA-pwh8-d4fr-nywn',
            'UNKNOWN_ACTIVE_ADVISORY_COUNT=0',
            'IGNORED_ADVISORY_COUNT=0',
            'ABANDONED_COUNT=0',
            'ACTIVE_AUDIT_IDS_UNIQUE=true',
            'SECURITY_AUDIT_GATE=PASS_ACCEPTED_APPLICABLE_DEBT',
        ],
    ],
    'CASE_2' => [
        'file' => 'case-2-active-both.json',
        'exit' => 0,
        'stdout' => [
            'ACTIVE_AUDIT_ADVISORY_COUNT=2',
            'ACTIVE_AUDIT_ADVISORY_ID=PKSA-w9tt-7782-78jx',
            'ACTIVE_AUDIT_ADVISORY_ID=PKSA-pwh8-d4fr-nywn',
            'INACTIVE_APPROVED_ADVISORY_COUNT=0',
            'UNKNOWN_ACTIVE_ADVISORY_COUNT=0',
            'SECURITY_AUDIT_GATE=PASS_ACCEPTED_APPLICABLE_DEBT',
        ],
    ],
    'CASE_3' => [
        'file' => 'case-3-active-empty.json',
        'exit' => 0,
        'stdout' => [
            'ACTIVE_AUDIT_ADVISORY_COUNT=0',
            'INACTIVE_APPROVED_ADVISORY_COUNT=2',
            'INACTIVE_APPROVED_ADVISORY_ID=PKSA-w9tt-7782-78jx',
            'INACTIVE_APPROVED_ADVISORY_ID=PKSA-pwh8-d4fr-nywn',
            'UNKNOWN_ACTIVE_ADVISORY_COUNT=0',
            'IGNORED_ADVISORY_COUNT=0',
            'SECURITY_AUDIT_GATE=PASS_ACCEPTED_APPLICABLE_DEBT',
        ],
    ],
    'CASE_4' => [
        'file' => 'case-4-unknown-id.json',
        'exit' => 1,
        'stdout' => [
            'UNKNOWN_ACTIVE_ADVISORY_COUNT=1',
            'UNKNOWN_ACTIVE_ADVISORY_ID=PKSA-unknown-0000-0000',
            'SECURITY_AUDIT_GATE=FAIL_UNKNOWN_ADVISORY',
        ],
        'stderr' => [
            'unknown_active_advisory=PKSA-unknown-0000-0000',
        ],
    ],
    'CASE_5' => [
        'file' => 'case-5-ignored-pwh8.json',
        'exit' => 1,
        'stdout' => [
            'ACTIVE_AUDIT_ADVISORY_ID=PKSA-w9tt-7782-78jx',
            'IGNORED_ADVISORY_COUNT=1',
            'IGNORED_ADVISORY_ID=PKSA-pwh8-d4fr-nywn',
            'SECURITY_AUDIT_GATE=FAIL_AUDIT_VISIBILITY',
        ],
        'stderr' => [
            'ignored_advisories=PKSA-pwh8-d4fr-nywn',
        ],
    ],
    'CASE_6' => [
        'file' => 'case-6-abandoned.json',
        'exit' => 0,
        'stdout' => [
            'ACTIVE_AUDIT_ADVISORY_ID=PKSA-w9tt-7782-78jx',
            'IGNORED_ADVISORY_COUNT=0',
            'APPROVED_ABANDONED_COUNT=2',
            'APPROVED_ABANDONED_PACKAGE=doctrine/cache',
            'APPROVED_ABANDONED_PACKAGE=swiftmailer/swiftmailer',
            'ABANDONED_COUNT=2',
            'ABANDONED_PACKAGE=doctrine/cache',
            'ABANDONED_REPLACEMENT=',
            'ABANDONED_PACKAGE=swiftmailer/swiftmailer',
            'ABANDONED_REPLACEMENT=symfony/mailer',
            'UNKNOWN_ABANDONED_COUNT=0',
            'SECURITY_AUDIT_GATE=PASS_ACCEPTED_APPLICABLE_DEBT',
        ],
    ],
    'CASE_7' => [
        'file' => 'case-7-unreachable.json',
        'exit' => 1,
        'stdout' => [
            'ACTIVE_AUDIT_ADVISORY_ID=PKSA-w9tt-7782-78jx',
            'UNREACHABLE_REPOSITORY_COUNT=1',
            'UNREACHABLE_REPOSITORY=packagist.org',
            'SECURITY_AUDIT_GATE=FAIL_UNREACHABLE_REPOSITORIES',
        ],
        'stderr' => [
            'unreachable_repositories=packagist.org',
        ],
    ],
    'CASE_8' => [
        'file' => 'case-8-additional-abandoned.json',
        'exit' => 1,
        'stdout' => [
            'ABANDONED_PACKAGE=doctrine/cache',
            'ABANDONED_PACKAGE=swiftmailer/swiftmailer',
            'ABANDONED_PACKAGE=vendor/unexpected-abandoned',
            'UNKNOWN_ABANDONED_COUNT=1',
            'UNKNOWN_ABANDONED_PACKAGE=vendor/unexpected-abandoned',
            'SECURITY_AUDIT_GATE=FAIL_ABANDONED_DEPENDENCIES',
        ],
        'stderr' => [
            'unknown_abandoned_package=vendor/unexpected-abandoned',
        ],
    ],
];

$failed = false;
foreach ($cases as $name => $case) {
    $path = $fixtureDir . '/' . $case['file'];
    $command = 'php ' . escapeshellarg($helper) . ' assert-audit ' . escapeshellarg($path);
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);
    if (!is_resource($process)) {
        fwrite(STDERR, "{$name}=FAIL runner_start\n");
        $failed = true;
        continue;
    }
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exit = proc_close($process);
    $stdout = is_string($stdout) ? $stdout : '';
    $stderr = is_string($stderr) ? $stderr : '';

    $missing = [];
    if ($exit !== $case['exit']) {
        $missing[] = "exit={$exit}";
    }
    foreach ($case['stdout'] as $needle) {
        if (!str_contains($stdout, $needle)) {
            $missing[] = "stdout:{$needle}";
        }
    }
    foreach ($case['stderr'] ?? [] as $needle) {
        if (!str_contains($stderr, $needle)) {
            $missing[] = "stderr:{$needle}";
        }
    }

    if ($missing === []) {
        echo "{$name}=PASS\n";
        continue;
    }

    $failed = true;
    echo "{$name}=FAIL " . implode(',', $missing) . "\n";
    fwrite(STDERR, "{$name} stdout:\n{$stdout}\n{$name} stderr:\n{$stderr}\n");
}

if ($failed) {
    fwrite(STDERR, "ADVISORY_POLICY_FIXTURES=FAIL\n");
    exit(1);
}

echo "ADVISORY_POLICY_FIXTURES=PASS\n";
