(function () {
	console.log("loading mail");

	CoCreate.actions.init({
		name: "sendMassEmails",
		callback: async (action) => {
			console.log("sending mail");
			const contactElement = document.getElementById("contactList");
			let value = contactElement.getValue();
			let query = {
				$and: [
					{ email: { $exists: true } },
					{ email: { $ne: null } },
					{ email: { $ne: "" } }
				]
			};

			switch (value) {
				case "newsletter":
					query["newsletter.opted_in"] = "on";
					break;
				case "subscribed":
					query["subscription"] = { $ne: "false" };
					break;
				default:
					// "all" does not modify the query
					break;
			}
			let data = await CoCreate.crud.send({
				method: "object.read",
				array: "users",
				$filter: {
					query
				}
			});

			if (data && data.object) {
				let formData = await action.form.getData();

				// Create a temporary DOM element
				const tempElement = document.createElement("div");
				tempElement.innerHTML = formData[0].object.content;

				const Messages = [];
				for (let i = 0; i < data.object.length; i++) {
					const message = {
						From: "news@yelloworacle.com", // Sender's email address
						To: data.object[i].email, // Recipient's email address
						Subject: formData[0].object.subject, // Email subject line
						HtmlBody: formData[0].object.content, // HTML content of the email
						TextBody: tempElement.innerText, // Plain text content for fallback
						MessageStream: "broadcast" // Message stream for categorization
					};
					Messages.push(message);
				}

				if (Messages.length) {
					try {
						let response = await CoCreate.socket.send({
							method: "postmark.sendEmailBatch", // Specifies the method for your API
							postmark: Messages
						});
						console.log(response);
					} catch (error) {
						console.error(
							`Error sending email to contact list: ${value}`
						);
					}
				}

				document.dispatchEvent(
					new CustomEvent("sendMassEmails", {
						detail: {}
					})
				);
			}
		}
	});
})();
