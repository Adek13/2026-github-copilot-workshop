import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import RequisitionCreatePage from '../../src/pages/RequisitionCreatePage.vue';

// Mock API module to avoid real network calls
vi.mock('../../src/api', () => ({
  api: {
    createRequisition: vi.fn(() => Promise.resolve({ id: 'pr-created' })),
  },
}));

// Mock vue-router useRouter and RouterLink
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}));

describe('RequisitionCreatePage', () => {
  it('renders form and default one line', () => {
    const wrapper = mount(RequisitionCreatePage);
    // header exists
    expect(wrapper.find('h2').text()).toContain('Create Purchase Requisition');
    // table has one row for lines
    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(1);
  });

  it('adds and removes lines correctly', async () => {
    const wrapper = mount(RequisitionCreatePage);
    const addBtn = wrapper.find('button.btn-outline');
    await addBtn.trigger('click');
    let rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(2);

    // remove second line
    const removeButtons = wrapper.findAll('button.btn-danger-icon');
    await removeButtons[1].trigger('click');
    rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(1);
  });

  it('submits form and calls api.createRequisition', async () => {
    const { api } = await import('../../src/api');
    const wrapper = mount(RequisitionCreatePage);

    // fill required fields
    await wrapper.find('input[placeholder="Type..."]').setValue('Requestor');
    await wrapper.findAll('input[placeholder="Type..."]')[1].setValue('Ops');
    await wrapper.findAll('input[placeholder="Type..."]')[2].setValue('Title');

    await wrapper.find('form').trigger('submit.prevent');
    expect(api.createRequisition).toHaveBeenCalled();
  });

  it('intentional failing test for pre-push hook validation', () => {
    expect(1 + 1).toBe(3);
  });
});
