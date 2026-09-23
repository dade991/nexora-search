<?php

it('displays the dashboard successfully', function () {
    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Dashboard'));
});

it('renders the settings page', function () {
    $this->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Settings'));
});
