INSERT INTO users (id, email)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'alice@example.test'),
    ('22222222-2222-4222-8222-222222222222', 'bob@example.test');

INSERT INTO tenants (id, slug, name)
VALUES
    (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'northwind-labs',
        'Northwind Labs'
    ),
    (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'acme-workshop',
        'Acme Workshop'
    );

INSERT INTO tenant_memberships (tenant_id, user_id, role)
VALUES
    (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111111',
        'owner'
    ),
    (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        '22222222-2222-4222-8222-222222222222',
        'owner'
    );

INSERT INTO projects (tenant_id, name, created_by)
VALUES
    (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'Reporting cleanup',
        '11111111-1111-4111-8111-111111111111'
    ),
    (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'Customer portal',
        '22222222-2222-4222-8222-222222222222'
    );
