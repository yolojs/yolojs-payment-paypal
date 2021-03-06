import paypal from 'paypal-rest-sdk';

export default function (node, logger) {

  node.on('billing-agreement-attributes-from-plan', function (plan) {
    const start_date = new Date()
    start_date.setSeconds(start_date.getSeconds() + 60);
    return (
      { name: plan.name
      , description: plan.description
      , start_date: start_date.toISOString()
      , plan: { id: plan.id }
      , payer: { payment_method: 'paypal' }
      }
    );
  });

  node.on('billing-agreement-get').then(':safe').trap(true, ':describe-error')
    .then(function ({ payload: id, config }, callback) {
      return paypal.billingAgreement.get(id, config, callback);
    }).end();

  node.on('billing-agreement-create').then(':safe').trap(true, ':describe-error')
    .then(function ({ payload: attributes, config }, callback) {
      return paypal.billingAgreement.create(attributes, config, callback);
    }).end();

  node.on('billing-agreement-execute').then(':safe').trap(true, ':describe-error')
    .then(function ({ payload: { token }, config }, callback) {
      return paypal.billingAgreement.execute(token, {}, config, callback);
    }).end();

  node.on('billing-agreement-cancel').then(':safe').trap(true, ':describe-error')
    .then(function ({ payload: { id, reason }, config }, callback) {
        return paypal.billingAgreement.cancel(id, { note: reason }, config, function (err, result) {
            if (err) {
              logger.log('Error', err);
              try {
                result = { status : 'error', httpStatusCode : err.response.httpStatusCode, type: 'json' };
                logger.log(err.response);
              } catch (e) {
                result = { status : 'error', httpStatusCode : '?', type: 'json' };
              }
            } else {
              logger.log('Success', result);
            }

            callback(err, result);
        });
    }).end();

};
