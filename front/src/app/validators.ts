// custom-validators.ts

import { ValidatorFn, AbstractControl } from '@angular/forms';

export function mustMatchValidator(
  controlName: string,
  matchingControlName: string
): ValidatorFn {
  return (group: AbstractControl): { [key: string]: any } | null => {
    const control = group.get(controlName);
    const matchingControl = group.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
      return { mustMatch: true };
    } else {
      matchingControl.setErrors(null);
      return null;
    }
  };
}
