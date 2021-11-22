/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'mutationobserver-shim';
import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, screen } from '@testing-library/react';
import { Account, AppContext } from '../../models';
import { HomePath } from '../../constants';
import { typeByTestIdFn } from '../../lib/test-utils';
import { mockAppContext, renderWithRouter } from '../../models/mocks';
import React from 'react';

import { Page2faReplaceRecoveryCodes } from '.';

jest.mock('../../models/AlertBarInfo');
const recoveryCodes = ['abc123'];
const account = {
  primaryEmail: {
    email: 'pbooth@mozilla.com',
  },
  replaceRecoveryCodes: jest.fn().mockResolvedValue({ recoveryCodes }),
} as unknown as Account;

const mockNavigate = jest.fn();
jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
}));

window.URL.createObjectURL = jest.fn();

async function renderPage2faReplaceRecoveryCodes() {
  await act(async () => {
    renderWithRouter(
      <AppContext.Provider value={mockAppContext({ account })}>
        <Page2faReplaceRecoveryCodes />
      </AppContext.Provider>
    );
  });
}

it('renders', async () => {
  await renderPage2faReplaceRecoveryCodes()

  expect(screen.getByTestId('2fa-recovery-codes')).toBeInTheDocument();

  expect(screen.getByTestId('2fa-recovery-codes')).toHaveTextContent(
    recoveryCodes[0]
  );

  expect(screen.getByTestId('continue-modal')).toBeInTheDocument();
});

it('displays an error when fails to fetch new recovery codes', async () => {
  const account = {
    replaceRecoveryCodes: jest.fn().mockRejectedValue(new Error('wat')),
  } as unknown as Account;
  const context = mockAppContext({ account });
  await act(async () => {
    renderWithRouter(
      <AppContext.Provider value={context}>
        <Page2faReplaceRecoveryCodes />
      </AppContext.Provider>
    );
  });
  expect(context.alertBarInfo?.error).toBeCalledTimes(1);
});

it('forces users to validate recovery code', async () => {
  await renderPage2faReplaceRecoveryCodes()

  await act(async () => {
    await fireEvent.click(screen.getByTestId('continue-modal'));
  })

  expect(screen.getByTestId('submit-recovery-code')).toBeDisabled();
})


it('will not allow bad recovery code', async () => {
  await renderPage2faReplaceRecoveryCodes()

  await act(async () => {
    await fireEvent.click(screen.getByTestId('continue-modal'));
    await typeByTestIdFn('recovery-code-input-field')('xyz');
    await fireEvent.click(screen.getByTestId('submit-recovery-code'))
  })

  expect(screen.getByTestId('tooltip')).toBeInTheDocument();
})


it('allows user to finish', async () => {
  await renderPage2faReplaceRecoveryCodes()

  await act(async () => {
    await fireEvent.click(screen.getByTestId('continue-modal'));
    await typeByTestIdFn('recovery-code-input-field')(recoveryCodes[0]);
    await fireEvent.click(screen.getByTestId('submit-recovery-code'));
  })

  expect(mockNavigate).toHaveBeenCalledWith(
    HomePath + '#two-step-authentication',
    { replace: true }
  );
})
